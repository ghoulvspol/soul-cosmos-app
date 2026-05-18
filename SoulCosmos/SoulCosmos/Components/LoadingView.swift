import SwiftUI

struct CosmicLoadingView: View {
    @State private var rotation: Double = 0
    let message: String

    var body: some View {
        VStack(spacing: 32) {
            ZStack {
                ForEach(0..<3) { i in
                    Circle()
                        .stroke(Color.cosmosGold.opacity(0.15), lineWidth: 1)
                        .frame(width: CGFloat(80 + i * 40), height: CGFloat(80 + i * 40))
                }
                Circle()
                    .trim(from: 0, to: 0.3)
                    .stroke(Color.cosmosGold, style: StrokeStyle(lineWidth: 2, lineCap: .round))
                    .frame(width: 80, height: 80)
                    .rotationEffect(.degrees(rotation))
                Circle()
                    .fill(Color.cosmosGold)
                    .frame(width: 8, height: 8)
                    .offset(y: -40)
                    .rotationEffect(.degrees(rotation * 1.5))
            }
            .onAppear {
                withAnimation(.linear(duration: 3).repeatForever(autoreverses: false)) {
                    rotation = 360
                }
            }

            Text(message)
                .font(CosmosFont.body(15))
                .foregroundColor(.cosmosTextSecondary)
        }
    }
}
