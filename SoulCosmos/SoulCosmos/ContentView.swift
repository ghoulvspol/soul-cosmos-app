import SwiftUI

struct ContentView: View {
    @StateObject private var profileVM = ProfileViewModel()

    var body: some View {
        NavigationStack {
            Group {
                switch profileVM.currentStep {
                case .welcome:
                    WelcomeView()
                case .birthInfo:
                    BirthInfoView()
                case .mbtiSelect:
                    MBTISelectView()
                case .loading:
                    ZStack {
                        Color.cosmosCanvas.ignoresSafeArea()
                        CosmicLoadingView(message: "正在解读你的灵魂...")
                    }
                case .result:
                    MainTabView()
                }
            }
            .animation(.easeInOut(duration: 0.5), value: profileVM.currentStep)
        }
        .environmentObject(profileVM)
    }
}

struct MainTabView: View {
    var body: some View {
        TabView {
            ProfileResultView()
                .tabItem {
                    Label("灵魂画像", systemImage: "sparkles")
                }

            DailyView()
                .tabItem {
                    Label("运势", systemImage: "sun.max.fill")
                }

            SettingsView()
                .tabItem {
                    Label("设置", systemImage: "gearshape.fill")
                }
        }
        .tint(.cosmosGold)
    }
}
