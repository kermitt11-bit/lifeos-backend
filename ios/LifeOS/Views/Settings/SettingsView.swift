import SwiftUI
import SwiftData

struct SettingsView: View {
    @EnvironmentObject var app: AppState
    @Environment(\.modelContext) private var context

    @State private var showingGoals = false
    @State private var showingExportPreview = false
    @State private var exportText: String = ""

    @Query private var journalEntries: [JournalEntry]
    @Query private var tasks: [PlannerTask]
    @Query private var habits: [Habit]
    @Query private var goals: [Goal]
    @Query private var moods: [MoodEntry]

    var body: some View {
        Form {
            Section("Profile") {
                TextField("Your name", text: $app.userName)
            }

            Section("Appearance") {
                Picker("Theme", selection: Binding(
                    get: { app.colorSchemePreference },
                    set: { app.colorSchemePreference = $0 }
                )) {
                    ForEach(AppState.ColorSchemePreference.allCases) { Text($0.label).tag($0) }
                }
            }

            Section("Reminders") {
                Toggle("Evening journal reminder", isOn: $app.dailyReminderEnabled)
                if app.dailyReminderEnabled {
                    Stepper(value: $app.dailyReminderHour, in: 6...23) {
                        Text("At \(app.dailyReminderHour):00")
                    }
                }
                Button("Request notification permission") {
                    Task { _ = await NotificationManager.shared.requestAuthorization() }
                }
            }

            Section("Goals") {
                NavigationLink("Manage goals") { GoalsView() }
            }

            Section("Sync (optional)") {
                NavigationLink("Backend sync") { BackendSyncView() }
                Text("Local-first. Sync only if you connect a backend in BackendService.")
                    .font(.caption).foregroundStyle(.secondary)
            }

            Section("Data") {
                Button {
                    exportText = buildExport()
                    showingExportPreview = true
                } label: { Label("Export as JSON", systemImage: "square.and.arrow.up") }
                Button(role: .destructive) {
                    deleteAllData()
                } label: { Label("Erase all local data", systemImage: "trash") }
            }

            Section("About") {
                HStack { Text("Version"); Spacer(); Text("1.0.0").foregroundStyle(.secondary) }
                HStack { Text("Build"); Spacer(); Text("local").foregroundStyle(.secondary) }
            }
        }
        .navigationTitle("Settings")
        .navigationBarTitleDisplayMode(.inline)
        .onChange(of: app.dailyReminderEnabled) { _, _ in NotificationManager.shared.scheduleDailyJournalReminder(hour: app.dailyReminderHour, enabled: app.dailyReminderEnabled) }
        .onChange(of: app.dailyReminderHour) { _, _ in NotificationManager.shared.scheduleDailyJournalReminder(hour: app.dailyReminderHour, enabled: app.dailyReminderEnabled) }
        .sheet(isPresented: $showingExportPreview) {
            NavigationStack {
                ScrollView {
                    Text(exportText)
                        .font(.system(.footnote, design: .monospaced))
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding()
                        .textSelection(.enabled)
                }
                .navigationTitle("Export")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        ShareLink(item: exportText) { Image(systemName: "square.and.arrow.up") }
                    }
                }
            }
        }
    }

    private func buildExport() -> String {
        let payload = ExportPayload(
            entries: journalEntries.map { .init(date: $0.date, title: $0.title, body: $0.body, mood: $0.moodScore, gratitude: $0.gratitude, highlights: $0.highlights, challenges: $0.challenges, tomorrowFocus: $0.tomorrowFocus, tags: $0.tags) },
            tasks: tasks.map { .init(title: $0.title, dueDate: $0.dueDate, isCompleted: $0.isCompleted, priority: $0.priority.rawValue, category: $0.category.rawValue, notes: $0.taskNotes) },
            habits: habits.map { .init(name: $0.name, color: $0.colorHex, symbol: $0.symbol, frequency: $0.frequency.rawValue, completions: $0.logs.filter { $0.completed }.map { $0.date }) },
            goals: goals.map { .init(title: $0.title, area: $0.area.rawValue, timeframe: $0.timeframe.rawValue, target: $0.targetDate, progress: $0.progress, completed: $0.isCompleted) },
            moods: moods.map { .init(date: $0.date, score: $0.score, energy: $0.energy, stress: $0.stress) }
        )
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        return (try? String(data: encoder.encode(payload), encoding: .utf8)) ?? "{}"
    }

    private func deleteAllData() {
        for entry in journalEntries { context.delete(entry) }
        for task in tasks { context.delete(task) }
        for habit in habits { context.delete(habit) }
        for goal in goals { context.delete(goal) }
        for mood in moods { context.delete(mood) }
        try? context.save()
    }
}

struct ExportPayload: Codable {
    struct JournalDTO: Codable { let date: Date; let title: String; let body: String; let mood: Int; let gratitude: [String]; let highlights: [String]; let challenges: String; let tomorrowFocus: String; let tags: [String] }
    struct TaskDTO: Codable { let title: String; let dueDate: Date; let isCompleted: Bool; let priority: Int; let category: String; let notes: String }
    struct HabitDTO: Codable { let name: String; let color: String; let symbol: String; let frequency: String; let completions: [Date] }
    struct GoalDTO: Codable { let title: String; let area: String; let timeframe: String; let target: Date; let progress: Double; let completed: Bool }
    struct MoodDTO: Codable { let date: Date; let score: Int; let energy: Int; let stress: Int }

    let entries: [JournalDTO]
    let tasks: [TaskDTO]
    let habits: [HabitDTO]
    let goals: [GoalDTO]
    let moods: [MoodDTO]
}

struct BackendSyncView: View {
    @AppStorage("backendURL") private var backendURL: String = ""
    @AppStorage("backendToken") private var backendToken: String = ""
    @State private var status: String = ""
    @State private var loading = false

    var body: some View {
        Form {
            Section("Backend") {
                TextField("https://your-backend.example.com", text: $backendURL)
                    .keyboardType(.URL).autocapitalization(.none).autocorrectionDisabled()
                SecureField("API token", text: $backendToken)
            }
            Section {
                Button {
                    Task { await test() }
                } label: {
                    HStack {
                        Text("Test connection")
                        Spacer()
                        if loading { ProgressView() }
                    }
                }
                .disabled(backendURL.isEmpty || loading)
                if !status.isEmpty {
                    Text(status).font(.subheadline).foregroundStyle(.secondary)
                }
            }
            Section {
                Text("Sync is optional. The app is fully usable offline; turn this on only if you've deployed the included Express + Supabase backend.")
                    .font(.caption).foregroundStyle(.secondary)
            }
        }
        .navigationTitle("Backend Sync")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func test() async {
        loading = true
        defer { loading = false }
        status = await BackendService.shared.health()
    }
}
