import Foundation
import SwiftData

enum HabitFrequency: String, Codable, CaseIterable, Identifiable {
    case daily, weekly, weekdays, weekends, custom
    var id: String { rawValue }
    var label: String {
        switch self {
        case .daily: return "Every day"
        case .weekly: return "Weekly"
        case .weekdays: return "Weekdays"
        case .weekends: return "Weekends"
        case .custom: return "Custom"
        }
    }
}

@Model
final class Habit {
    @Attribute(.unique) var id: UUID
    var name: String
    var habitDetails: String
    var symbol: String
    var colorHex: String
    var frequencyRaw: String
    var targetPerWeek: Int
    var reminderHour: Int?
    var reminderMinute: Int?
    var createdAt: Date
    var isArchived: Bool

    @Relationship(deleteRule: .cascade, inverse: \HabitLog.habit) var logs: [HabitLog] = []

    init(
        id: UUID = UUID(),
        name: String,
        habitDetails: String = "",
        symbol: String = "checkmark.circle.fill",
        colorHex: String = "#10B981",
        frequency: HabitFrequency = .daily,
        targetPerWeek: Int = 7,
        reminderHour: Int? = nil,
        reminderMinute: Int? = nil
    ) {
        self.id = id
        self.name = name
        self.habitDetails = habitDetails
        self.symbol = symbol
        self.colorHex = colorHex
        self.frequencyRaw = frequency.rawValue
        self.targetPerWeek = targetPerWeek
        self.reminderHour = reminderHour
        self.reminderMinute = reminderMinute
        self.createdAt = .now
        self.isArchived = false
    }

    var frequency: HabitFrequency {
        get { HabitFrequency(rawValue: frequencyRaw) ?? .daily }
        set { frequencyRaw = newValue.rawValue }
    }

    func isCompleted(on date: Date) -> Bool {
        let day = Calendar.current.startOfDay(for: date)
        return logs.contains { Calendar.current.isDate($0.date, inSameDayAs: day) && $0.completed }
    }

    func currentStreak() -> Int {
        let cal = Calendar.current
        var day = cal.startOfDay(for: .now)
        var streak = 0
        while isCompleted(on: day) {
            streak += 1
            guard let prev = cal.date(byAdding: .day, value: -1, to: day) else { break }
            day = prev
        }
        return streak
    }

    func completionsThisWeek() -> Int {
        let cal = Calendar.current
        guard let weekStart = cal.dateInterval(of: .weekOfYear, for: .now)?.start else { return 0 }
        return logs.filter { $0.completed && $0.date >= weekStart }.count
    }
}

@Model
final class HabitLog {
    @Attribute(.unique) var id: UUID
    var date: Date
    var completed: Bool
    var logNotes: String
    var habit: Habit?

    init(id: UUID = UUID(), date: Date = .now, completed: Bool = true, logNotes: String = "") {
        self.id = id
        self.date = Calendar.current.startOfDay(for: date)
        self.completed = completed
        self.logNotes = logNotes
    }
}
