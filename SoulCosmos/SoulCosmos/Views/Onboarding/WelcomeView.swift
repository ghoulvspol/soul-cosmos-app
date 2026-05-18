import SwiftUI

struct WelcomeView: View {
    @EnvironmentObject var vm: ProfileViewModel
    @State private var showContent = false

    var body: some View {
        ZStack {
            Color.cosmosCanvas.ignoresSafeArea()
            StarfieldView()

            VStack(spacing: 40) {
                Spacer()

                VStack(spacing: 16) {
                    Text("✦")
                        .font(.system(size: 48))
                        .foregroundColor(.cosmosGold)
                        .shadow(color: .cosmosGold.opacity(0.5), radius: 20)

                    Text("Soul Cosmos")
                        .font(CosmosFont.heading(42))
                        .foregroundColor(.cosmosTextPrimary)

                    Text("发现你的多维灵魂画像")
                        .font(CosmosFont.body(17))
                        .foregroundColor(.cosmosTextSecondary)
                }
                .opacity(showContent ? 1 : 0)
                .offset(y: showContent ? 0 : 30)

                VStack(spacing: 16) {
                    Button("开始探索") {
                        withAnimation(.easeInOut(duration: 0.5)) {
                            vm.currentStep = .birthInfo
                        }
                    }
                    .buttonStyle(GoldButtonStyle())
                    .padding(.horizontal, 40)

                    Text("融合占星 · 八字 · 紫微 · MBTI · 易经")
                        .font(CosmosFont.body(13))
                        .foregroundColor(.cosmosTextMuted)
                }
                .opacity(showContent ? 1 : 0)
                .offset(y: showContent ? 0 : 20)

                Spacer()
            }
        }
        .onAppear {
            withAnimation(.easeOut(duration: 1.2).delay(0.3)) {
                showContent = true
            }
        }
    }
}
