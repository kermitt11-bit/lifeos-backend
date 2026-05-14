import SwiftUI
import SwiftData

struct RootView: View {
    @EnvironmentObject var app: AppState
    @State private var selection: Tab = .today

    enum Tab: Hashable {
        case today, planner, journal, habits, goals, insights, settings
    }

    var body: some View {
        Group {
            if app.hasCompletedOnboarding {
                TabView(selection: $selection) {
                    TodayView()
                        .tabItem { Label("Today", systemImage: "sun.max.fill") }
                        .tag(Tab.today)

                    PlannerView()
                        .tabItem { Label("Planner", systemImage: "calendar") }
                        .tag(Tab.planner)

                    JournalView()
                        .tabItem { Label("Journal", systemImage: "book.closed.fill") }
                        .tag(Tab.journal)

                    HabitsView()
                        .tabItem { Label("Habits", systemImage: "checkmark.seal.fill") }
                        .tag(Tab.habits)

                    InsightsView()
                        .tabItem { Label("Insights", systemImage: "chart.bar.fill") }
                        .tag(Tab.insights)
                }
            } else {
                OnboardingView()
            }
        }
    }
}

struct OnboardingView: View {
    @EnvironmentObject var app: AppState
    @State private var page = 0
    @State private var nameInput = ""

    private let pages: [(symbol: String, title: String, subtitle: String)] = [
        ("sun.max.fill", "Plan your day", "Tasks, time blocks, priorities — your whole day in one calm view."),
        ("book.closed.fill", "Journal with intent", "Mood, gratitude, highlights, and reflection prompts every evening."),
        ("checkmark.seal.fill", "Build habits that stick", "Streaks, weekly targets, and a year-at-a-glance heatmap."),
        ("chart.bar.fill", "See your life clearly", "Insights across mood, focus, and progress on what matters most.")
    ]

    var body: some View {
        VStack(spacing: 32) {
            Spacer()
            TabView(selection: $page) {
                ForEach(pages.indices, id: \.self) { i in
                    VStack(spacing: 24) {
                        Image(systemName: pages[i].symbol)
                            .font(.system(size: 84, weight: .semibold))
                            .foregroundStyle(Theme.accent)
                        VStack(spacing: 12) {
                            Text(pages[i].title).font(.largeTitle.weight(.bold))
                            Text(pages[i].subtitle)
                                .font(.title3)
                                .foregroundStyle(.secondary)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, 24)
                        }
                    }
                    .tag(i)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .always))
            .frame(maxHeight: 420)

            if page == pages.count - 1 {
                VStack(spacing: 12) {
                    TextField("What should we call you?", text: $nameInput)
                        .textFieldStyle(.roundedBorder)
                        .padding(.horizontal, 24)
                    PrimaryButton(title: "Start journaling", symbol: "arrow.right") {
                        app.userName = nameInput.trimmingCharacters(in: .whitespaces)
                        app.hasCompletedOnboarding = true
                    }
                    .padding(.horizontal, 24)
                }
            } else {
                Button("Skip") { app.hasCompletedOnboarding = true }
                    .font(.subheadline)
            }
            Spacer()
        }
        .background(Theme.canvas.ignoresSafeArea())
    }
}
