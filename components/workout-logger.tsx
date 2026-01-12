"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Trash2,
  Edit2,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  "https://kvvyrpuwnxvrqwubcbyd.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dnlycHV3bnh2cnF3dWJjYnlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NzM3MTQsImV4cCI6MjA4MDU0OTcxNH0.jeoG7oK--qaUYxiZAmhUWaojZzU5s7Kkk6J0CXqMTgE"
);

interface WorkoutEntry {
  id: string;
  exerciseName: string;
  weight: number;
  weightUnit: "lbs" | "kgs";
  reps: number;
  note?: string;
  rest?: number;
  rir?: number;
  rpe?: number;
  tut?: {
    concentric: number;
    eccentric: number;
    isometric: number;
  };
  timestamp: Date;
  formattedTime: string;
  nextSetTime?: string;
  localSaved: boolean;
  serverSaved: boolean;
}

export function WorkoutLogger() {
  // FIXED: Moved QR code generation to useEffect to prevent hydration mismatch
  const [qrCodeId, setQrCodeId] = useState("");

  const [machineName, setMachineName] = useState("");
  const [isEditingMachineName, setIsEditingMachineName] = useState(false);

  const [exerciseName, setExerciseName] = useState("");
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState<"lbs" | "kgs">("lbs");
  const [reps, setReps] = useState("");
  const [note, setNote] = useState("");
  const [entries, setEntries] = useState<WorkoutEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [rest, setRest] = useState("");

  const [showTut, setShowTut] = useState(false);
  const [tutConcentric, setTutConcentric] = useState("");
  const [tutEccentric, setTutEccentric] = useState("");
  const [tutIsometric, setTutIsometric] = useState("");
  const [rir, setRir] = useState("");
  const [rpe, setRpe] = useState("");

  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [gymOwnerConnected, setGymOwnerConnected] = useState(false);
  const [gymContactInfo, setGymContactInfo] = useState("");
  const [showContactForm, setShowContactForm] = useState(false);

  // Add these with your other useState declarations:
  const [user, setUser] = useState<any>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Generate session ID
  const getSessionId = () => {
    let sessionId = sessionStorage.getItem("workout_session_id");
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 9)}`;
      sessionStorage.setItem("workout_session_id", sessionId);
    }
    return sessionId;
  };

  // Generate QR code ID only on client
  useEffect(() => {
    const randomId = Math.random().toString(36).substr(2, 9).toUpperCase();
    const formattedId = `${randomId.slice(0, 3)}-${randomId.slice(
      3,
      6
    )}-${randomId.slice(6, 9)}`;
    setQrCodeId(formattedId);
  }, []);

  // Load workouts from Supabase on component mount
  useEffect(() => {
    async function loadWorkouts() {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (user.user) {
          const { data: workouts, error } = await supabase
            .from("workouts")
            .select("*")
            .eq("user_id", user.user.id)
            .order("created_at", { ascending: false });

          if (error) throw error;

          // Convert to WorkoutEntry format
          const formattedWorkouts = workouts.map((w: any) => ({
            id: w.id.toString(),
            exerciseName: w.exercise_name,
            weight: w.weight,
            weightUnit: (w.weight_unit || "lbs") as "lbs" | "kgs",
            reps: w.reps,
            note: w.note || undefined,
            rest: w.rest_seconds || undefined,
            rir: w.rir || undefined,
            rpe: w.rpe || undefined,
            tut:
              w.tut_concentric || w.tut_eccentric || w.tut_isometric
                ? {
                    concentric: w.tut_concentric || 0,
                    eccentric: w.tut_eccentric || 0,
                    isometric: w.tut_isometric || 0,
                  }
                : undefined,
            timestamp: new Date(w.created_at),
            formattedTime: `${new Date(w.created_at).toLocaleDateString(
              "en-US",
              {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              }
            )}\n${new Date(w.created_at).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            })}`,
            nextSetTime: w.rest_seconds
              ? calculateNextSetTime(w.rest_seconds)
              : undefined,
            localSaved: true,
            serverSaved: true,
          }));

          setEntries(formattedWorkouts);
        }
      } catch (error) {
        console.error("Error loading workouts:", error);
      }
    }

    loadWorkouts();
  }, []);

  // Handle authentication
  useEffect(() => {
    // Check current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setIsLoadingAuth(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setIsLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Live Clock Component - Fixed hydration error
  function LiveClock() {
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
      setCurrentTime(new Date());

      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);

      return () => clearInterval(timer);
    }, []);

    // Don't render on server or during initial hydration
    if (!mounted || !currentTime) {
      return (
        <div className="mt-6 text-center">
          <div className="text-sm text-muted-foreground mb-1">Loading...</div>
        </div>
      );
    }

    return (
      <div className="mt-6 text-center">
        <div className="text-sm text-muted-foreground mb-1">
          {currentTime.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </div>
        <div className="text-muted-foreground font-sans text-2xl">
          {currentTime.toLocaleTimeString("en-US", {
            hour12: true,
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
          })}
        </div>
      </div>
    );
  }

  function formatTime(date: Date) {
    const dateStr = date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    return { dateStr, timeStr };
  }

  function calculateNextSetTime(restSeconds: number) {
    const nextTime = new Date(Date.now() + restSeconds * 1000);
    return nextTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  }

  const handleLog = async () => {
    if (!exerciseName.trim() || !weight.trim() || !reps.trim()) {
      return;
    }

    console.log("=== HANDLE LOG STARTED ===");

    const now = new Date();
    const timeData = formatTime(now);
    const restSeconds = rest.trim() ? Number.parseInt(rest) : undefined;
    const nextSetTime = restSeconds
      ? calculateNextSetTime(restSeconds)
      : undefined;

    const hasTut =
      tutConcentric.trim() || tutEccentric.trim() || tutIsometric.trim();
    const tutData = hasTut
      ? {
          concentric: Number.parseInt(tutConcentric) || 0,
          eccentric: Number.parseInt(tutEccentric) || 0,
          isometric: Number.parseInt(tutIsometric) || 0,
        }
      : undefined;

    // Try to save to Supabase - ALWAYS try, even without user
    let serverSaved = false;
    let savedEntryId = editingId || `${Date.now()}`;

    try {
      const { data: user } = await supabase.auth.getUser();
      console.log("User check:", user.user ? "Logged in" : "NOT logged in");

      // Prepare data - ALWAYS save to Supabase
      const workoutData: any = {
        session_id: getSessionId(),
        machine_name: machineName || "Unnamed Machine",
        exercise_name: exerciseName,
        weight: Number.parseFloat(weight),
        weight_unit: weightUnit,
        reps: Number.parseInt(reps),
        rest_seconds: restSeconds || null,
        note: note.trim() || null,
        rir: rir.trim() ? Number.parseInt(rir) : null,
        rpe: rpe.trim() ? Number.parseFloat(rpe) : null,
        tut_concentric: tutConcentric.trim()
          ? Number.parseInt(tutConcentric)
          : null,
        tut_eccentric: tutEccentric.trim()
          ? Number.parseInt(tutEccentric)
          : null,
        tut_isometric: tutIsometric.trim()
          ? Number.parseInt(tutIsometric)
          : null,
        created_at: now.toISOString(),
      };

      // Only add user_id if user exists
      if (user.user) {
        workoutData.user_id = user.user.id;
        console.log("✅ Saving with user_id:", user.user.id);
      } else {
        console.log("⚠️ Saving anonymously to Supabase (no user_id)");
      }

      console.log("Attempting to save to Supabase:", workoutData);

      const { data, error } = await supabase
        .from("workouts")
        .insert(workoutData)
        .select()
        .single();

      if (error) {
        console.error("❌ Supabase insert error:", error);
        throw error;
      }

      serverSaved = true;
      savedEntryId = data.id.toString();
      console.log("✅ SUCCESS! Saved to Supabase. ID:", savedEntryId);
    } catch (error) {
      console.error("❌ Error saving to Supabase:", error);
      // Continue with local save even if database fails
    }

    const newEntry: WorkoutEntry = {
      id: savedEntryId,
      exerciseName,
      weight: Number.parseFloat(weight),
      weightUnit,
      reps: Number.parseInt(reps),
      note: note.trim() || undefined,
      rest: restSeconds,
      rir: rir.trim() ? Number.parseInt(rir) : undefined,
      rpe: rpe.trim() ? Number.parseFloat(rpe) : undefined,
      tut: tutData,
      timestamp: now,
      formattedTime: `${timeData.dateStr}\n${timeData.timeStr}`,
      nextSetTime,
      localSaved: true,
      serverSaved,
    };

    if (editingId) {
      setEntries(
        entries.map((entry) => (entry.id === editingId ? newEntry : entry))
      );
      setEditingId(null);
    } else {
      setEntries([newEntry, ...entries]);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoadingAuth(true);

    // Determine if we're on mobile (accessing via IP) or desktop (localhost)
    const isMobile = window.location.hostname !== "localhost";
    const redirectUrl = isMobile
      ? "http://192.168.12.19:3000/auth/callback" // For phone
      : `${window.location.origin}/auth/callback`; // For browser

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Google login error:", error);
      setIsLoadingAuth(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleEdit = (entry: WorkoutEntry) => {
    setExerciseName(entry.exerciseName);
    setWeight(entry.weight.toString());
    setWeightUnit(entry.weightUnit);
    setReps(entry.reps.toString());
    setNote(entry.note || "");
    setRest(entry.rest?.toString() || "");
    setRir(entry.rir?.toString() || "");
    setRpe(entry.rpe?.toString() || "");
    if (entry.tut) {
      setTutConcentric(entry.tut.concentric.toString());
      setTutEccentric(entry.tut.eccentric.toString());
      setTutIsometric(entry.tut.isometric.toString());
      setShowTut(true);
    } else {
      setTutConcentric("");
      setTutEccentric("");
      setTutIsometric("");
      setShowTut(false);
    }
    if (entry.rir || entry.rpe || entry.tut) {
      setShowTut(true);
    }
    setEditingId(entry.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    // Try to delete from Supabase first
    try {
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        const { error } = await supabase
          .from("workouts")
          .delete()
          .eq("id", Number.parseInt(id))
          .eq("user_id", user.user.id);
        if (error) throw error;
      }
    } catch (error) {
      console.error("Error deleting from database:", error);
      // Continue with local delete even if database fails
    }

    // Update local state
    setEntries(entries.filter((entry) => entry.id !== id));
    if (editingId === id) {
      setExerciseName("");
      setWeight("");
      setReps("");
      setRest("");
      setRir("");
      setRpe("");
      setShowTut(false);
      setEditingId(null);
    }
  };

  const handleCancel = () => {
    setExerciseName("");
    setWeight("");
    setReps("");

    setRest("");

    setRir("");
    setRpe("");
    setShowTut(false);
    setEditingId(null);
  };

  function handleSubmitMaintenance() {
    if (!maintenanceMessage.trim()) return;

    try {
      console.log("[v0] Sending maintenance report:", {
        machine: machineName,
        message: maintenanceMessage,
        timestamp: new Date().toISOString(),
      });

      setMaintenanceMessage("");
      setShowMaintenanceModal(false);
    } catch (error) {
      console.error("Error submitting maintenance report:", error);
    }
  }

  function handleSubmitContactInfo() {
    if (!gymContactInfo.trim()) return;

    try {
      console.log("[v0] Submitting gym contact info:", {
        machine: machineName,
        contactInfo: gymContactInfo,
        timestamp: new Date().toISOString(),
      });

      setGymContactInfo("");
      setShowContactForm(false);
    } catch (error) {
      console.error("Error submitting contact info:", error);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary">
      <style jsx global>{`
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>

      <div className="flex-1 w-full max-w-md mx-auto p-4 sm:p-6">
        <div className="sm:pt-8 sm:pb-8 leading-7 pb-2.5 pt-3">
          {isEditingMachineName ? (
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Smith, Bench Press, etc."
                  value={machineName}
                  onChange={(e) => setMachineName(e.target.value)}
                  onBlur={() => setIsEditingMachineName(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setIsEditingMachineName(false);
                    }
                  }}
                  className="w-full bg-input border-border text-foreground placeholder:text-muted-foreground sm:text-xl font-bold text-base"
                />
              </div>
              <Button
                onClick={() => setIsEditingMachineName(false)}
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-4 py-2"
              >
                Done
              </Button>
            </div>
          ) : (
            <div
              onClick={() => setIsEditingMachineName(true)}
              className="cursor-pointer group"
            >
              <h1 className="sm:text-3xl font-bold text-foreground group-hover:text-accent transition-colors text-2xl">
                {machineName || "Exercise Machine Name"}
              </h1>
              <p className="text-xs text-muted-foreground mt-1 group-hover:text-foreground transition-colors">
                Tap to edit
              </p>
            </div>
          )}
        </div>

        {/* Input Card */}
        <Card className="p-5 sm:p-6 shadow-lg mb-6 border-border/50">
          <div className="space-y-4">
            <div>
              <label className="block text-base sm:text-lg font-semibold text-foreground mb-3">
                Exercise <span className="text-accent">*</span>
              </label>
              <Input
                type="text"
                placeholder="Squat, Chest, Curl, etc."
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                className="w-full bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="grid grid-cols-5 gap-3 sm:gap-4">
              <div className="col-span-3">
                <label className="block text-base sm:text-lg font-semibold text-foreground mb-3">
                  Weight <span className="text-accent">*</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="0"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="flex-1 bg-input border-border text-foreground"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setWeightUnit(weightUnit === "lbs" ? "kgs" : "lbs")
                    }
                    className="px-3 py-2 text-xs sm:text-sm font-semibold rounded-md border border-border bg-muted hover:bg-accent hover:text-accent-foreground transition-colors min-w-[50px]"
                  >
                    {weightUnit}
                  </button>
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-base sm:text-lg font-semibold text-foreground mb-3">
                  Reps <span className="text-accent">*</span>
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  className="w-full bg-input border-border text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-5 gap-3 sm:gap-4">
              <div className="col-span-3">
                <label className="block text-base sm:text-lg font-semibold text-foreground mb-3">
                  Rest b/w sets{" "}
                </label>
                <Input
                  type="number"
                  placeholder="0 seconds"
                  value={rest}
                  onChange={(e) => setRest(e.target.value)}
                  className="w-full bg-input border-border text-foreground"
                />
              </div>

              <div className="col-span-2 flex items-end">
                <Button
                  onClick={() => setShowNoteModal(true)}
                  variant="outline"
                  className="border-border hover:bg-muted text-foreground bg-transparent flex items-center justify-center gap-2 h-10 w-full"
                >
                  <Edit2 className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {note ? `Note (${note.length})` : "Add Note"}
                  </span>
                </Button>
              </div>
            </div>

            <div className="border border-border/50 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowTut(!showTut)}
                className="w-full flex items-center justify-between p-3 text-base font-semibold text-foreground hover:bg-muted/50 transition-colors text-center mx-0 px-5"
              >
                <span className="text-center">ADVANCED</span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-xs font-normal">Optional</span>
                  {showTut ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </span>
              </button>

              {showTut && (
                <div className="p-3 pt-0 space-y-3 border-t border-border/50">
                  {/* RIR & RPE - Fixed */}
                  <div className="grid grid-cols-2 gap-3 pt-3">
                    <div className="flex flex-col items-center">
                      <div className="text-base font-bold text-foreground">
                        RIR
                      </div>
                      <div className="text-[10px] sm:text-xs text-center text-muted-foreground mb-2 leading-tight">
                        Reps in Reserve
                      </div>
                      <Input
                        type="number"
                        placeholder="1-4"
                        value={rir}
                        onChange={(e) => setRir(e.target.value)}
                        className="w-full bg-input border-border text-foreground text-center text-base py-2"
                      />
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="text-base font-bold text-foreground">
                        RPE
                      </div>
                      <div className="text-[10px] sm:text-xs text-center text-muted-foreground mb-2 leading-tight px-1">
                        Rate of Perceived Exertion
                      </div>
                      <Input
                        type="number"
                        placeholder="6-10"
                        value={rpe}
                        onChange={(e) => setRpe(e.target.value)}
                        className="w-full bg-input border-border text-foreground text-center text-base py-2"
                      />
                    </div>
                  </div>

                  {/* Time Under Tension - Fixed */}
                  <div className="space-y-3 pt-2">
                    <div className="text-center">
                      <div className="text-base font-bold text-foreground">
                        TUT
                      </div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">
                        Time Under Tension (seconds)
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col items-center">
                        <div className="text-xs font-medium text-foreground mb-1">
                          Concentric
                        </div>
                        <Input
                          type="number"
                          placeholder="0"
                          value={tutConcentric}
                          onChange={(e) => setTutConcentric(e.target.value)}
                          className="w-full bg-input border-border text-foreground text-center text-base"
                        />
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="text-xs font-medium text-foreground mb-1">
                          Eccentric
                        </div>
                        <Input
                          type="number"
                          placeholder="0"
                          value={tutEccentric}
                          onChange={(e) => setTutEccentric(e.target.value)}
                          className="w-full bg-input border-border text-foreground text-center text-base"
                        />
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="text-xs font-medium text-foreground mb-1">
                          Isometric
                        </div>
                        <Input
                          type="number"
                          placeholder="0"
                          value={tutIsometric}
                          onChange={(e) => setTutIsometric(e.target.value)}
                          className="w-full bg-input border-border text-foreground text-center text-base"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 sm:gap-4 pt-2 sm:pt-4">
              <Button
                onClick={handleLog}
                className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-base sm:text-lg py-5 sm:py-6 rounded-lg transition-all transform hover:scale-105 active:scale-95"
              >
                {editingId ? "UPDATE" : "LOG SET"}
              </Button>
              {editingId && (
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1 border-border hover:bg-muted text-foreground bg-transparent"
                >
                  Cancel
                </Button>
              )}
            </div>

            {/* Live Clock */}
            <LiveClock />
          </div>
        </Card>

{/* Auth UI Component */}
        <div className="mb-6">
          {isLoadingAuth ? (
            <div className="text-sm text-muted-foreground text-center py-2">
              Checking authentication...
            </div>
          ) : user ? (
            <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                {user.user_metadata?.avatar_url && (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div>
                  <p className="text-sm font-medium">
                    {user.user_metadata?.full_name || user.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Your workouts are saved privately
                  </p>
                </div>
              </div>
              <Button
                onClick={handleLogout}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="text-center bg-muted/30 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-3">
                Sign in with Google to save workouts privately across devices
              </p>
              <Button
                onClick={handleGoogleLogin}
                className="bg-white text-gray-900 hover:bg-gray-100 border border-gray-300 w-full"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </Button>
            </div>
          )}
        </div>

        {/* Entries List */}
        <div className="space-y-2">
          {/* Show warning only if user is NOT logged in AND there are entries */}
          {!user && entries.length > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-3 rounded-r">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Not logged in:</strong> Workouts will only save to
                    this device and will be lost if you refresh or close the
                    browser.{" "}
                    <button
                      onClick={handleGoogleLogin}
                      className="font-medium underline text-yellow-700 hover:text-yellow-600"
                    >
                      Login with Google to save permanently.
                    </button>
                  </p>
                </div>
              </div>
            </div>
          )}

          {entries.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-0">
              No workouts logged yet. Start by logging your first exercise!
            </p>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => (
                <div key={entry.id}>
                  <div className="flex items-stretch justify-between gap-3 p-4 sm:p-5 rounded-lg hover:bg-muted/50 transition-colors group min-h-[140px] border border-border/30">
                    <div className="flex-1 min-w-0">
                      {/* LINE 4: NEXT SET TIME - Important, colored */}
                      {entry.nextSetTime && (
                        <p className="text-sm text-accent font-semibold mt-2">
                          ⏱️ Next set: {entry.nextSetTime}
                        </p>
                      )}

                      {/* LINE 1: EXERCISE NAME - Larger */}
                      <p className="text-lg sm:text-xl font-bold text-foreground">
                        {entry.exerciseName}
                      </p>

                      {/* LINE 2: WEIGHT/REPS - Larger */}
                      <p className="text-base sm:text-lg text-foreground mt-2">
                        {entry.weight} {entry.weightUnit} × {entry.reps} reps
                      </p>

                      {/* LINE 5: RIR/RPE - If exists */}
                      {(entry.rir || entry.rpe) && (
                        <div className="flex gap-4 mt-2">
                          {entry.rir && (
                            <span className="text-xs sm:text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                              RIR: {entry.rir}
                            </span>
                          )}
                          {entry.rpe && (
                            <span className="text-xs sm:text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                              RPE: {entry.rpe}
                            </span>
                          )}
                        </div>
                      )}

                      {/* LINE 6: TUT - If exists */}
                      {entry.tut &&
                        (entry.tut.concentric > 0 ||
                          entry.tut.eccentric > 0 ||
                          entry.tut.isometric > 0) && (
                          <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                            TUT:{" "}
                            {[
                              entry.tut.concentric > 0 &&
                                `Con. ${entry.tut.concentric}s`,
                              entry.tut.eccentric > 0 &&
                                `Ecc. ${entry.tut.eccentric}s`,
                              entry.tut.isometric > 0 &&
                                `Iso. ${entry.tut.isometric}s`,
                            ]
                              .filter(Boolean)
                              .join(" • ")}
                          </p>
                        )}

                      {/* LINE 3: DATE & TIME - Prominent but subtle */}
                      <div className="mt-3">
                        <p className="text-sm text-muted-foreground font-medium">
                          {entry.formattedTime.split("\n")[0]} •{" "}
                          {entry.formattedTime.split("\n")[1]}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons - keep existing */}
                    <div className="flex flex-col items-center justify-between flex-shrink-0">
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="p-1.5 rounded text-destructive hover:bg-destructive/10 transition-colors"
                          aria-label="Delete entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(entry)}
                          className="p-1.5 rounded text-primary hover:bg-primary/10 transition-colors"
                          aria-label="Edit entry"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex gap-0.5">
                        <span
                          className={`text-xs ${
                            entry.localSaved
                              ? "text-muted-foreground"
                              : "text-muted-foreground/30"
                          }`}
                        >
                          ✓
                        </span>
                        <span
                          className={`text-xs ${
                            entry.serverSaved
                              ? "text-muted-foreground"
                              : "text-muted-foreground/30"
                          }`}
                        >
                          ✓
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Note section - keep existing */}
                  {entry.note && (
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                      <p className="text-sm text-muted-foreground italic bg-muted/30 p-3 rounded">
                        <span className="font-semibold">Note: </span>
                        {entry.note}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-8 pb-8">
          <Button
            onClick={() => setShowMaintenanceModal(true)}
            variant="outline"
            className="w-full hover:bg-destructive/10 flex items-center justify-center gap-2 text-muted-foreground leading-7 border-muted-foreground"
          >
            <AlertCircle className="w-4 h-4" />
            Report Maintenance Issue
          </Button>
        </div>

        {/* Maintenance Modal */}
        {showMaintenanceModal && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md bg-background rounded-t-lg sm:rounded-lg shadow-xl border-border/50 p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-foreground">
                  Report Maintenance
                </h2>
                <button
                  onClick={() => setShowMaintenanceModal(false)}
                  className="p-1 rounded hover:bg-muted transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {gymOwnerConnected ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Describe the maintenance issue or problem you're
                    experiencing with this machine.
                  </p>
                  <textarea
                    placeholder="Describe the issue..."
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    className="w-full p-3 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground resize-none h-28"
                  />
                  <div className="flex gap-3">
                    <Button
                      onClick={handleSubmitMaintenance}
                      className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
                    >
                      Send Report
                    </Button>
                    <Button
                      onClick={() => setShowMaintenanceModal(false)}
                      variant="outline"
                      className="flex-1 border-border hover:bg-muted text-foreground bg-transparent"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {!showContactForm ? (
                    <div>
                      <p className="text-sm text-muted-foreground mb-4">
                        The gym owner for this machine hasn't set up the
                        maintenance reporting system yet.
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Help us connect with the gym owner by providing their
                        contact information, and we'll get them set up so you
                        can report maintenance issues directly.
                      </p>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => setShowContactForm(true)}
                          className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
                        >
                          Provide Gym Info
                        </Button>
                        <Button
                          onClick={() => setShowMaintenanceModal(false)}
                          variant="outline"
                          className="flex-1 border-border hover:bg-muted text-foreground bg-transparent"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <button
                        onClick={() => setShowContactForm(false)}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
                      >
                        ← Back
                      </button>
                      <p className="text-sm text-muted-foreground mb-4">
                        Please provide any contact information you have for the
                        gym owner or management (email, phone, gym name, etc.).
                      </p>
                      <textarea
                        placeholder="Gym name, owner email, phone number, etc."
                        value={gymContactInfo}
                        onChange={(e) => setGymContactInfo(e.target.value)}
                        className="w-full p-3 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground resize-none h-28"
                      />
                      <div className="flex gap-3 mt-4">
                        <Button
                          onClick={handleSubmitContactInfo}
                          className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
                        >
                          Submit Info
                        </Button>
                        <Button
                          onClick={() => {
                            setShowContactForm(false);
                            setShowMaintenanceModal(false);
                          }}
                          variant="outline"
                          className="flex-1 border-border hover:bg-muted text-foreground bg-transparent"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Notes Modal */}
        {showNoteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md bg-background p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Add Note</h2>
                <button
                  onClick={() => setShowNoteModal(false)}
                  className="p-1 rounded hover:bg-muted"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full p-3 border rounded-lg min-h-[100px] bg-input text-foreground"
                placeholder="Warm up set, pain in shoulder, etc."
              />
              <div className="flex gap-3 mt-4">
                <Button
                  onClick={() => setShowNoteModal(false)}
                  className="flex-1"
                >
                  Save Note
                </Button>
                <Button
                  onClick={() => {
                    setNote("");
                    setShowNoteModal(false);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Clear
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* QR ID at the bottom of the page - Only shows after hydration */}
        {qrCodeId && (
          <div className="pt-6 pb-2 text-center">
            <p className="text-[11px] sm:text-xs text-muted-foreground/60 font-mono tracking-wide">
              URL-QR-ID: {qrCodeId}
            </p>
          </div>
        )}

        {/* Footer Spacing */}
        <div className="h-8 sm:h-12" />
      </div>
    </div>
  );
}
