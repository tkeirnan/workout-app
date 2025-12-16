"use client"

import { useState } from "react"
import { Home, QrCode, ShoppingBag, User, Check } from "lucide-react"
import { WorkoutLogger } from "./workout-logger"

type TabType = "home" | "qrcodes" | "shop" | "account"

export function NavigationTabs() {
  const [activeTab, setActiveTab] = useState<TabType>("home")

  const tabs = [
    { id: "home" as const, label: "Home", icon: Home },
    { id: "qrcodes" as const, label: "MyQRs", icon: QrCode },
    { id: "shop" as const, label: "Shop", icon: ShoppingBag },
    { id: "account" as const, label: "Account", icon: User },
  ]

  const stickerPacks = [
    { id: 1, count: 5, price: 9.99 },
    { id: 2, count: 10, price: 17.99 },
    { id: 3, count: 15, price: 24.99 },
    { id: 4, count: 20, price: 29.99 },
  ]

  const memberships = [
    {
      id: 1,
      name: "Sticker User",
      description: "Track workouts on your personal machines",
      price: "Free",
      features: ["Unlimited workouts", "5 machine QR codes", "Basic analytics"],
    },
    {
      id: 2,
      name: "Gym Owner",
      description: "Manage multiple machines and user data",
      price: "$29.99/month",
      features: ["Unlimited machines", "User analytics", "Maintenance alerts", "Premium support"],
    },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Content Area */}
      <div className="flex-1 pb-20">
        {activeTab === "home" && <WorkoutLogger />}
        {activeTab === "qrcodes" && (
          <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <QrCode className="w-12 h-12 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">My QR Codes</h2>
            <p className="text-muted-foreground text-center">
              View and manage all your exercise machine QR codes here.
            </p>
          </div>
        )}
        {activeTab === "shop" && (
          <div className="flex-1 p-4 max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-6 mt-4">Shop</h2>

            {/* Sticker Packs Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-4">QR Code Sticker Packs</h3>
              <div className="grid grid-cols-2 gap-4">
                {stickerPacks.map((pack) => (
                  <div
                    key={pack.id}
                    className="border border-border rounded-lg p-4 flex flex-col items-center justify-center hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="text-3xl font-bold text-foreground mb-2">{pack.count}</div>
                    <div className="text-sm text-muted-foreground mb-3">Stickers</div>
                    <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-md text-sm transition-colors">
                      ${pack.price}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Memberships Section */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Membership Plans</h3>
              <div className="space-y-4">
                {memberships.map((membership) => (
                  <div
                    key={membership.id}
                    className="border border-border rounded-lg p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-lg font-bold text-foreground">{membership.name}</h4>
                        <p className="text-sm text-muted-foreground">{membership.description}</p>
                      </div>
                      <div className="text-lg font-bold text-orange-500">{membership.price}</div>
                    </div>
                    <ul className="space-y-2 mb-4">
                      {membership.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-foreground">
                          <Check className="w-4 h-4 text-orange-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <button className="w-full bg-foreground hover:bg-foreground/80 text-background font-semibold py-2 rounded-md text-sm transition-colors">
                      {membership.id === 1 ? "Current Plan" : "Upgrade"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {activeTab === "account" && (
          <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <User className="w-12 h-12 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Account</h2>
            <p className="text-muted-foreground text-center">Manage your profile, settings, and preferences.</p>
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-around h-20">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center gap-1 px-4 py-2 transition-colors ${
                  isActive ? "text-white" : "text-gray-400 hover:text-white"
                }`}
                aria-label={tab.label}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
