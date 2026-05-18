import SwiftUI

struct StarfieldView: View {
    @State private var stars: [Star] = []
    let count: Int

    struct Star {
        var x: CGFloat
        var y: CGFloat
        var size: CGFloat
        var opacity: Double
        var speed: Double
    }

    init(count: Int = 120) {
        self.count = count
    }

    var body: some View {
        TimelineView(.animation) { timeline in
            Canvas { ctx, size in
                let time = timeline.date.timeIntervalSinceReferenceDate
                for star in stars {
                    let twinkle = sin(time * star.speed + star.x * 10) * 0.3 + 0.7
                    let point = CGPoint(x: star.x * size.width, y: star.y * size.height)
                    let rect = CGRect(x: point.x - star.size/2, y: point.y - star.size/2, width: star.size, height: star.size)
                    ctx.opacity = star.opacity * twinkle
                    ctx.fill(Path(ellipseIn: rect), with: .color(.white))
                }
            }
        }
        .onAppear {
            stars = (0..<count).map { _ in
                Star(
                    x: CGFloat.random(in: 0...1),
                    y: CGFloat.random(in: 0...1),
                    size: CGFloat.random(in: 1...3),
                    opacity: Double.random(in: 0.2...0.8),
                    speed: Double.random(in: 0.5...2.0)
                )
            }
        }
        .ignoresSafeArea()
    }
}
