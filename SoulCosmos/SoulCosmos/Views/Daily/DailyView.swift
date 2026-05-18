import SwiftUI

struct DailyView: View {
    @StateObject private var vm = DailyViewModel()
    @State private var selectedTab = 0

    var body: some View {
        ZStack {
            Color.cosmosCanvas.ignoresSafeArea()

            if vm.isLoading {
                CosmicLoadingView(message: "正在获取今日运势...")
            } else {
                ScrollView {
                    VStack(spacing: 24) {
                        // Header
                        VStack(spacing: 8) {
                            Text(todayStr)
                                .font(CosmosFont.body(14))
                                .foregroundColor(.cosmosTextMuted)
                            Text("今日运势")
                                .font(CosmosFont.heading(32))
                                .foregroundColor(.cosmosTextPrimary)
                        }
                        .padding(.top, 20)

                        // Tab picker
                        HStack(spacing: 0) {
                            tabBtn("日运", 0)
                            tabBtn("周运", 1)
                            tabBtn("月运", 2)
                        }
                        .padding(.horizontal, 24)

                        // Content
                        if selectedTab == 0, let f = vm.forecast {
                            dailyCard(f)
                        } else if selectedTab == 1, let f = vm.weeklyForecast {
                            weeklyCard(f)
                        } else if selectedTab == 2, let f = vm.monthlyForecast {
                            monthlyCard(f)
                        } else if let err = vm.errorMessage {
                            Text(err)
                                .font(CosmosFont.body(15))
                                .foregroundColor(.cosmosCoral)
                                .padding()
                        }
                    }
                    .padding(.horizontal, 24)
                }
            }
        }
        .task {
            // 从 UserDefaults 读取出生信息
            vm.birthInfo = loadBirthInfo()
            await vm.loadAll()
        }
    }

    private func tabBtn(_ title: String, _ index: some Equatable) -> some View {
        Button {
            withAnimation { selectedTab = index as! Int }
        } label: {
            Text(title)
                .font(CosmosFont.body(15).weight(selectedTab == index as! Int ? .semibold : .regular))
                .foregroundColor(selectedTab == index as! Int ? .cosmosGold : .cosmosTextMuted)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(
                    VStack {
                        Spacer()
                        if selectedTab == index as! Int {
                            Rectangle()
                                .fill(Color.cosmosGold)
                                .frame(height: 2)
                        }
                    }
                )
        }
    }

    private func dailyCard(_ f: DailyForecast) -> some View {
        VStack(spacing: 20) {
            // Mood indicator
            if let mood = f.mood {
                HStack(spacing: 8) {
                    Circle()
                        .fill(moodColor(mood))
                        .frame(width: 10, height: 10)
                    Text(moodLabel(mood))
                        .font(CosmosFont.body(14))
                        .foregroundColor(.cosmosTextSecondary)
                }
            }

            // Theme
            if let theme = f.theme {
                Text(theme)
                    .font(CosmosFont.heading(22))
                    .foregroundColor(.cosmosTextPrimary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(6)
            }

            // Tip
            if let tip = f.tip {
                HStack {
                    Image(systemName: "lightbulb.fill")
                        .foregroundColor(.cosmosGold)
                    Text(tip)
                        .font(CosmosFont.body(15))
                        .foregroundColor(.cosmosTextSecondary)
                }
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
                .glassCard()
            }
        }
        .padding()
        .glassCard()
    }

    private func weeklyCard(_ f: WeeklyForecast) -> some View {
        VStack(spacing: 16) {
            Text(f.theme ?? "")
                .font(CosmosFont.heading(20))
                .foregroundColor(.cosmosTextPrimary)
                .multilineTextAlignment(.center)

            if let day = f.highlightDay, let reason = f.highlightReason {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("本周重要日")
                            .font(CosmosFont.body(12))
                            .foregroundColor(.cosmosTextMuted)
                        Text(day)
                            .font(CosmosFont.heading(24))
                            .foregroundColor(.cosmosGold)
                    }
                    Spacer()
                    Text(reason)
                        .font(CosmosFont.body(14))
                        .foregroundColor(.cosmosTextSecondary)
                        .multilineTextAlignment(.trailing)
                }
                .padding()
                .glassCard()
            }
        }
        .padding()
        .glassCard()
    }

    private func monthlyCard(_ f: MonthlyForecast) -> some View {
        VStack(spacing: 16) {
            Text(f.theme ?? "")
                .font(CosmosFont.heading(20))
                .foregroundColor(.cosmosTextPrimary)
                .multilineTextAlignment(.center)

            if let focus = f.focus {
                HStack(spacing: 8) {
                    Image(systemName: "target")
                        .foregroundColor(.cosmosAmethyst)
                    Text("本月焦点：\(focus)")
                        .font(CosmosFont.body(15))
                        .foregroundColor(.cosmosTextSecondary)
                }
                .padding()
                .glassCard()
            }
        }
        .padding()
        .glassCard()
    }

    private var todayStr: String {
        let f = DateFormatter(); f.dateFormat = "yyyy年M月d日 EEEE"; f.locale = Locale(identifier: "zh_CN")
        return f.string(from: Date())
    }

    private func moodColor(_ mood: String) -> Color {
        switch mood {
        case "creative": return .cosmosGold
        case "reflective": return .cosmosAmethyst
        case "social": return .cosmosCyan
        case "quiet": return .cosmosTextMuted
        default: return .cosmosTextSecondary
        }
    }

    private func moodLabel(_ mood: String) -> String {
        switch mood {
        case "creative": return "创造模式"
        case "reflective": return "反思模式"
        case "social": return "社交模式"
        case "quiet": return "安静模式"
        default: return mood
        }
    }

    private func loadBirthInfo() -> BirthInfo {
        var info = BirthInfo()
        if let saved = UserDefaults.standard.string(forKey: "birth_date") {
            let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"
            info.date = f.date(from: saved) ?? Date()
        }
        info.mbtiType = UserDefaults.standard.string(forKey: "mbti_type") ?? ""
        info.gender = BirthInfo.Gender(rawValue: UserDefaults.standard.string(forKey: "gender") ?? "unknown") ?? .unknown
        return info
    }
}
