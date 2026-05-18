import SwiftUI

struct MBTISelectView: View {
    @EnvironmentObject var vm: ProfileViewModel
    @Environment(\.dismiss) var dismiss

    let columns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12),
    ]

    var body: some View {
        ZStack {
            Color.cosmosCanvas.ignoresSafeArea()

            VStack(spacing: 24) {
                Text("选择你的 MBTI 类型")
                    .font(CosmosFont.heading(28))
                    .foregroundColor(.cosmosTextPrimary)
                    .padding(.top, 40)

                Text("不确定？可以跳过，我们用其他系统分析")
                    .font(CosmosFont.body(14))
                    .foregroundColor(.cosmosTextSecondary)

                LazyVGrid(columns: columns, spacing: 12) {
                    ForEach(MBTI_ALL) { type in
                        Button {
                            vm.birthInfo.mbtiType = type.code
                        } label: {
                            VStack(spacing: 4) {
                                Text(type.code)
                                    .font(CosmosFont.body(15).weight(.semibold))
                                Text(type.name)
                                    .font(CosmosFont.body(11))
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(vm.birthInfo.mbtiType == type.code ? Color.cosmosGold.opacity(0.2) : Color.cosmosSurface2)
                            .foregroundColor(vm.birthInfo.mbtiType == type.code ? .cosmosGold : .cosmosTextPrimary)
                            .cornerRadius(12)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(vm.birthInfo.mbtiType == type.code ? Color.cosmosGold.opacity(0.5) : Color.white.opacity(0.06), lineWidth: 1)
                            )
                        }
                    }
                }
                .padding(.horizontal, 16)

                Spacer()

                VStack(spacing: 12) {
                    Button("生成灵魂画像") {
                        Task { await vm.generateProfile() }
                    }
                    .buttonStyle(GoldButtonStyle())
                    .disabled(vm.birthInfo.mbtiType.isEmpty)
                    .opacity(vm.birthInfo.mbtiType.isEmpty ? 0.5 : 1)

                    Button("跳过，直接生成") {
                        vm.birthInfo.mbtiType = "ENFP"
                        Task { await vm.generateProfile() }
                    }
                    .buttonStyle(GhostButtonStyle())
                }
                .padding(.horizontal, 40)
                .padding(.bottom, 40)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
    }
}
