import SwiftUI

struct ProfileResultView: View {
    @EnvironmentObject var vm: ProfileViewModel
    @State private var currentPage = 0
    @State private var showContent = false

    private var dimensions: [(String, String, String?)] {
        guard let p = vm.profile else { return [] }
        return [
            ("你是谁", p.whoYouAre ?? "", "person.fill"),
            ("你如何爱", p.howYouLove ?? "", "heart.fill"),
            ("你的天赋", p.whereYouThrive ?? "", "star.fill"),
            ("你的阴影", p.yourShadows ?? "", "moon.fill"),
            ("你的季节", p.yourSeason ?? "", "leaf.fill"),
            ("完整画像", p.theFullPicture ?? "", "sparkles"),
        ]
    }

    var body: some View {
        ZStack {
            Color.cosmosCanvas.ignoresSafeArea()

            VStack(spacing: 0) {
                // Keywords
                if let keywords = vm.profile?.soulKeywords, !keywords.isEmpty {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 10) {
                            ForEach(keywords, id: \.self) { kw in
                                Text(kw)
                                    .font(CosmosFont.body(13))
                                    .foregroundColor(.cosmosGold)
                                    .padding(.horizontal, 14)
                                    .padding(.vertical, 6)
                                    .background(Color.cosmosGold.opacity(0.1))
                                    .cornerRadius(20)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 20)
                                            .stroke(Color.cosmosGold.opacity(0.3), lineWidth: 1)
                                    )
                            }
                        }
                        .padding(.horizontal, 24)
                    }
                    .padding(.vertical, 16)
                }

                // TabView for 6 dimensions
                TabView(selection: $currentPage) {
                    ForEach(Array(dimensions.enumerated()), id: \.offset) { i, dim in
                        ScrollView {
                            VStack(spacing: 24) {
                                // Icon
                                Image(systemName: dim.2 ?? "sparkles")
                                    .font(.system(size: 40))
                                    .foregroundColor(.cosmosGold)
                                    .shadow(color: .cosmosGold.opacity(0.3), radius: 12)

                                // Title
                                Text(dim.0)
                                    .font(CosmosFont.heading(28))
                                    .foregroundColor(.cosmosTextPrimary)

                                // Content
                                Text(dim.1)
                                    .font(CosmosFont.body(17))
                                    .foregroundColor(.cosmosTextSecondary)
                                    .lineSpacing(8)
                                    .multilineTextAlignment(.center)
                                    .padding(.horizontal, 32)
                            }
                            .padding(.vertical, 40)
                        }
                        .tag(i)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .always))
                .indexViewStyle(.page(backgroundDisplayMode: .always))

                // Page indicator
                HStack(spacing: 8) {
                    ForEach(0..<dimensions.count, id: \.self) { i in
                        Circle()
                            .fill(i == currentPage ? Color.cosmosGold : Color.cosmosTextMuted)
                            .frame(width: i == currentPage ? 8 : 6, height: i == currentPage ? 8 : 6)
                    }
                }
                .padding(.bottom, 16)

                // Actions
                HStack(spacing: 16) {
                    Button {
                        vm.reset()
                    } label: {
                        Label("重新生成", systemImage: "arrow.counterclockwise")
                            .font(CosmosFont.body(14))
                    }
                    .buttonStyle(GhostButtonStyle())

                    Button {
                        // Share action
                    } label: {
                        Label("分享", systemImage: "square.and.arrow.up")
                            .font(CosmosFont.body(14))
                    }
                    .buttonStyle(GhostButtonStyle())
                }
                .padding(.bottom, 40)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .opacity(showContent ? 1 : 0)
        .onAppear {
            withAnimation(.easeOut(duration: 0.8)) { showContent = true }
        }
    }
}
