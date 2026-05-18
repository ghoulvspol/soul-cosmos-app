import SwiftUI

struct BirthInfoView: View {
    @EnvironmentObject var vm: ProfileViewModel
    @State private var showContent = false
    @State private var showPrivacy = true

    var body: some View {
        ZStack {
            Color.cosmosCanvas.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 32) {
                    // Header
                    VStack(spacing: 8) {
                        Text("出生信息")
                            .font(CosmosFont.heading(32))
                            .foregroundColor(.cosmosTextPrimary)
                        Text("我们需要你的出生时间来计算星盘")
                            .font(CosmosFont.body(15))
                            .foregroundColor(.cosmosTextSecondary)
                    }
                    .padding(.top, 60)

                    // Form
                    VStack(spacing: 24) {
                        // Date
                        VStack(alignment: .leading, spacing: 8) {
                            Label("出生日期", systemImage: "calendar")
                                .font(CosmosFont.body(14))
                                .foregroundColor(.cosmosTextSecondary)
                            DatePicker("", selection: $vm.birthInfo.date, displayedComponents: .date)
                                .datePickerStyle(.graphical)
                                .tint(.cosmosGold)
                                .padding()
                                .glassCard()
                        }

                        // Time
                        VStack(alignment: .leading, spacing: 8) {
                            Label("出生时间", systemImage: "clock")
                                .font(CosmosFont.body(14))
                                .foregroundColor(.cosmosTextSecondary)
                            DatePicker("", selection: $vm.birthInfo.time, displayedComponents: .hourAndMinute)
                                .datePickerStyle(.wheel)
                                .labelsHidden()
                                .frame(height: 120)
                                .glassCard()
                        }

                        // Gender
                        VStack(alignment: .leading, spacing: 8) {
                            Label("性别", systemImage: "person")
                                .font(CosmosFont.body(14))
                                .foregroundColor(.cosmosTextSecondary)
                            HStack(spacing: 12) {
                                ForEach(BirthInfo.Gender.allCases, id: \.self) { g in
                                    Button {
                                        vm.birthInfo.gender = g
                                    } label: {
                                        Text(g.label)
                                            .font(CosmosFont.body(15))
                                            .frame(maxWidth: .infinity)
                                            .padding(.vertical, 12)
                                            .background(vm.birthInfo.gender == g ? Color.cosmosGold.opacity(0.2) : Color.cosmosSurface2)
                                            .foregroundColor(vm.birthInfo.gender == g ? .cosmosGold : .cosmosTextSecondary)
                                            .cornerRadius(10)
                                            .overlay(
                                                RoundedRectangle(cornerRadius: 10)
                                                    .stroke(vm.birthInfo.gender == g ? Color.cosmosGold.opacity(0.5) : Color.clear, lineWidth: 1)
                                            )
                                    }
                                }
                            }
                        }

                        // MBTI shortcut
                        VStack(alignment: .leading, spacing: 8) {
                            Label("MBTI 类型（可跳过）", systemImage: "brain")
                                .font(CosmosFont.body(14))
                                .foregroundColor(.cosmosTextSecondary)
                            NavigationLink {
                                MBTISelectView()
                            } label: {
                                HStack {
                                    Text(vm.birthInfo.mbtiType.isEmpty ? "选择 MBTI" : vm.birthInfo.mbtiType)
                                        .foregroundColor(vm.birthInfo.mbtiType.isEmpty ? .cosmosTextMuted : .cosmosGold)
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .foregroundColor(.cosmosTextMuted)
                                }
                                .padding()
                                .glassCard()
                            }
                        }
                    }
                    .padding(.horizontal, 24)

                    // Next button
                    Button("下一步") {
                        withAnimation(.easeInOut(duration: 0.5)) {
                            vm.currentStep = .mbtiSelect
                        }
                    }
                    .buttonStyle(GoldButtonStyle())
                    .padding(.horizontal, 40)
                    .padding(.bottom, 40)
                }
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .opacity(showContent ? 1 : 0)
        .sheet(isPresented: $showPrivacy) {
            PrivacyConsentView(showPrivacy: $showPrivacy)
        }
        .onAppear {
            withAnimation(.easeOut(duration: 0.6)) { showContent = true }
        }
    }
}
