import Foundation
import UserNotifications

final class NotificationManager {
    static let shared = NotificationManager()
    private let center = UNUserNotificationCenter.current()

    private init() {}

    func requestAuthorization() async -> Bool {
        do {
            return try await center.requestAuthorization(options: [.alert, .sound, .badge])
        } catch {
            return false
        }
    }

    func scheduleReminder(for task: PlannerTask) {
        guard let date = task.reminderDate else { return }
        let content = UNMutableNotificationContent()
        content.title = task.title
        content.body = task.taskNotes.isEmpty ? "Time to focus on this." : task.taskNotes
        content.sound = .default

        let comps = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: date)
        let trigger = UNCalendarNotificationTrigger(dateMatching: comps, repeats: false)
        let request = UNNotificationRequest(identifier: "task.\(task.id.uuidString)", content: content, trigger: trigger)
        center.add(request)
    }

    func scheduleHabitReminder(for habit: Habit) {
        guard let hour = habit.reminderHour, let minute = habit.reminderMinute else { return }
        let content = UNMutableNotificationContent()
        content.title = habit.name
        content.body = "Time for your daily habit."
        content.sound = .default

        var comps = DateComponents()
        comps.hour = hour
        comps.minute = minute
        let trigger = UNCalendarNotificationTrigger(dateMatching: comps, repeats: true)
        let request = UNNotificationRequest(identifier: "habit.\(habit.id.uuidString)", content: content, trigger: trigger)
        center.add(request)
    }

    func scheduleDailyJournalReminder(hour: Int, enabled: Bool) {
        let id = "journal.daily.reminder"
        center.removePendingNotificationRequests(withIdentifiers: [id])
        guard enabled else { return }

        let content = UNMutableNotificationContent()
        content.title = "Tonight's reflection"
        content.body = "A few minutes of journaling helps you reset for tomorrow."
        content.sound = .default

        var comps = DateComponents()
        comps.hour = hour
        comps.minute = 0
        let trigger = UNCalendarNotificationTrigger(dateMatching: comps, repeats: true)
        let request = UNNotificationRequest(identifier: id, content: content, trigger: trigger)
        center.add(request)
    }
}
