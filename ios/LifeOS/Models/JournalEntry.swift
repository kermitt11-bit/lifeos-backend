import Foundation
import SwiftData

@Model
final class JournalEntry {
    @Attribute(.unique) var id: UUID
    var date: Date
    var title: String
    var body: String
    var moodScore: Int
    var gratitude: [String]
    var highlights: [String]
    var challenges: String
    var tomorrowFocus: String
    var tags: [String]
    var weather: String?
    var locationName: String?
    var createdAt: Date
    var updatedAt: Date

    init(
        id: UUID = UUID(),
        date: Date = .now,
        title: String = "",
        body: String = "",
        moodScore: Int = 5,
        gratitude: [String] = [],
        highlights: [String] = [],
        challenges: String = "",
        tomorrowFocus: String = "",
        tags: [String] = [],
        weather: String? = nil,
        locationName: String? = nil
    ) {
        self.id = id
        self.date = date
        self.title = title
        self.body = body
        self.moodScore = moodScore
        self.gratitude = gratitude
        self.highlights = highlights
        self.challenges = challenges
        self.tomorrowFocus = tomorrowFocus
        self.tags = tags
        self.weather = weather
        self.locationName = locationName
        self.createdAt = .now
        self.updatedAt = .now
    }

    var moodLabel: String {
        switch moodScore {
        case ...2: return "Low"
        case 3...4: return "Meh"
        case 5...6: return "Okay"
        case 7...8: return "Good"
        default: return "Great"
        }
    }

    var moodEmoji: String {
        switch moodScore {
        case ...1: return "😞"
        case 2...3: return "😕"
        case 4...5: return "😐"
        case 6...7: return "🙂"
        case 8...9: return "😊"
        default: return "🤩"
        }
    }

    var wordCount: Int {
        body.split { $0.isWhitespace || $0.isNewline }.count
    }
}
