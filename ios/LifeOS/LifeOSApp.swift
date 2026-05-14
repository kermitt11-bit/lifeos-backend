import SwiftUI
import SwiftData

@main
struct LifeOSApp: App {
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(appState)
                .preferredColorScheme(appState.colorSchemePreference.swiftUIScheme)
                .tint(Theme.accent)
        }
        .modelContainer(for: [
            JournalEntry.self,
            PlannerTask.self,
            Subtask.self,
            TimeBlock.self,
            Habit.self,
            HabitLog.self,
            Goal.self,
            MoodEntry.self
        ])
    }
}

final class AppState: ObservableObject {
    enum ColorSchemePreference: String, CaseIterable, Identifiable {
        case system, light, dark
        var id: String { rawValue }
        var label: String {
            switch self {
            case .system: return "System"
            case .light: return "Light"
            case .dark: return "Dark"
            }
        }
        var swiftUIScheme: ColorScheme? {
            switch self {
            case .system: return nil
            case .light: return .light
            case .dark: return .dark
            }
        }
    }

    @AppStorage("colorSchemePreference") private var stored: String = ColorSchemePreference.system.rawValue
    @AppStorage("hasCompletedOnboarding") var hasCompletedOnboarding: Bool = false
    @AppStorage("userName") var userName: String = ""
    @AppStorage("dailyReminderHour") var dailyReminderHour: Int = 21
    @AppStorage("dailyReminderEnabled") var dailyReminderEnabled: Bool = false

    var colorSchemePreference: ColorSchemePreference {
        get { ColorSchemePreference(rawValue: stored) ?? .system }
        set {
            stored = newValue.rawValue
            objectWillChange.send()
        }
    }
}
