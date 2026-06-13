"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Archive, Bell } from "lucide-react"
import type { AppNotification } from "@/lib/notification-types"

type Props = {
  notifications: AppNotification[]
  actionPath: string
  label?: string
}

export function NotificationsMenu({ notifications, actionPath, label = "Notifications" }: Props) {
  const [items, setItems] = useState(notifications)
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const activeItems = items.filter((notification) => !notification.archived_at)
  const unreadCount = activeItems.filter((notification) => !notification.read_at).length
  const visibleNotifications = useMemo(
    () =>
      activeItems.filter((notification) => {
        if (filter === "unread") {
          return !notification.read_at
        }

        if (filter === "read") {
          return Boolean(notification.read_at)
        }

        return true
      }),
    [activeItems, filter],
  )

  useEffect(() => {
    setItems(notifications)
  }, [notifications])

  useEffect(() => {
    if (!open) {
      return
    }

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick)
    document.addEventListener("keydown", closeOnEscape)

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick)
      document.removeEventListener("keydown", closeOnEscape)
    }
  }, [open])

  const markRead = async (notificationId?: string) => {
    const readAt = new Date().toISOString()
    setItems((current) => current.map((notification) => (!notificationId || notification.id === notificationId ? { ...notification, read_at: notification.read_at ?? readAt } : notification)))
    await postNotificationAction(actionPath, "read", notificationId)
  }

  const archiveNotification = async (notificationId: string) => {
    const archivedAt = new Date().toISOString()
    setItems((current) => current.map((notification) => (notification.id === notificationId ? { ...notification, archived_at: archivedAt, read_at: notification.read_at ?? archivedAt } : notification)))
    await postNotificationAction(actionPath, "archive", notificationId)
  }

  return (
    <div className="relative" ref={menuRef}>
      <button className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-white/75 px-3 py-2 text-sm font-semibold shadow-sm backdrop-blur hover:border-primary/30 hover:bg-white" onClick={() => setOpen((value) => !value)} type="button">
        <span className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </span>
        {label}
      </button>
      {open && <div className="absolute right-0 z-40 mt-2 w-[min(24rem,calc(100vw-2rem))] rounded-lg border bg-white/92 p-3 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-bold">Notifications</h2>
          {activeItems.length > 0 && (
            <button className="text-xs font-semibold text-primary hover:text-primary/80" onClick={() => void markRead()} type="button">
              Mark all read
            </button>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          {(["all", "unread", "read"] as const).map((item) => (
            <button
              key={item}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold capitalize ${filter === item ? "bg-primary text-primary-foreground" : "bg-white hover:bg-muted"}`}
              onClick={() => setFilter(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mt-3 max-h-96 space-y-2 overflow-auto">
          {visibleNotifications.length > 0 ? (
            visibleNotifications.map((notification) => (
              <details
                key={notification.id}
                className={`rounded-md border p-3 ${notification.read_at ? "bg-muted/40 text-muted-foreground" : "bg-white"}`}
                onToggle={(event) => {
                  if (event.currentTarget.open && !notification.read_at) {
                    void markRead(notification.id)
                  }
                }}
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">{notification.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{notification.message}</p>
                  </div>
                  {!notification.read_at && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </summary>

                <div className="mt-3 border-t pt-3">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{notification.message}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{new Date(notification.created_at).toLocaleString()}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {!notification.read_at && (
                      <button className="rounded-md border bg-white px-3 py-1.5 text-xs font-semibold text-primary hover:bg-muted" onClick={() => void markRead(notification.id)} type="button">
                        Mark read
                      </button>
                    )}
                    <button className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-1.5 text-xs font-semibold hover:bg-muted" onClick={() => void archiveNotification(notification.id)} type="button">
                      <Archive className="h-3.5 w-3.5" />
                      Archive
                    </button>
                  </div>
                </div>
              </details>
            ))
          ) : (
            <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">No notifications found.</p>
          )}
        </div>
      </div>}
    </div>
  )
}

async function postNotificationAction(actionPath: string, action: "read" | "archive", notificationId?: string) {
  try {
    const formData = new FormData()
    formData.set("action", action)

    if (notificationId) {
      formData.set("notificationId", notificationId)
    }

    await fetch(actionPath, {
      method: "POST",
      body: formData,
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
      },
    })
  } catch (error) {
    console.error("Notification action failed", error)
  }
}
