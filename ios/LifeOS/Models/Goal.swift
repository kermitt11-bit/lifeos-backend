import Foundation
import SwiftData

enum GoalTimeframe: String, Codable, CaseIterable, Identifiable {
    case week, month, quarter, year, longTerm
    var id: String { rawValue }
    var label: String {
        switch self {
        case .week: return "This Week"
        case .month: return "This Month"
        case .quarter: return "This Quarter"
        case .year: return "This Year"
        case .longTerm: return "Long Term"
        }
    }
}

enum GoalArea: String, Codable, CaseIterable, Identifiable {
    case health, career, relationships, finance, learning, creative, mindfulness, adventure
    var id: String { rawValue }
    var label: String { rawValue.capitalized }
    var symbol: String {
        switch self {
        case .health: return "heart.fill"
        case .career: return "briefcase.fill"
        case .relationships: return "person.2.fill"
        case .finance: return "dollarsign.circle.fill"
        case .learning: return "book.fill"
        case .creative: return "paintbrush.fill"
        case .mindfulness: return "leaf.fill"
        case .adventure: return "mountain.2.fill"
        }
    }
}

@Model
final class Goal {
    @Attribute(.unique) var id: UUID
    var title: String
    var goalDescription: String
    var timeframeRaw: String
    var areaRaw: String
    var targetDate: Date
    var progress: Double
    var isCompleted: Bool
    var milestoneSummary: String
    var createdAt: Date

    @Relationship(deleteRule: .nullify, inverse: \PlannerTask.goal) var linkedTasks: [PlannerTask] = []

    init(
        id: UUID = UUID(),
        title: String,
        goalDescription: String = "",
        timeframe: GoalTimeframe = .month,
        area: GoalArea = .career,
        targetDate: Date = Calendar.current.date(byAdding: .month, value: 1, to: .now) ?? .now,
        progress: Double = 0,
        milestoneSummary: String = ""
    ) {
        self.id = id
        self.title = title
        self.goalDescription = goalDescription
        self.timeframeRaw = timeframe.rawValue
        self.areaRaw = area.rawValue
        self.targetDate = targetDate
        self.progress = progress
        self.isCompleted = false
        self.milestoneSummary = milestoneSummary
        self.createdAt = .now
    }

    var timeframe: GoalTimeframe {
        get { GoalTimeframe(rawValue: timeframeRaw) ?? .month }
        set { timeframeRaw = newValue.rawValue }
    }

    var area: GoalArea {
        get { GoalArea(rawValue: areaRaw) ?? .career }
        set { areaRaw = newValue.rawValue }
    }

    var daysRemaining: Int {
        let cal = Calendar.current
        let start = cal.startOfDay(for: .now)
        let end = cal.startOfDay(for: targetDate)
        return cal.dateComponents([.day], from: start, to: end).day ?? 0
    }
}
