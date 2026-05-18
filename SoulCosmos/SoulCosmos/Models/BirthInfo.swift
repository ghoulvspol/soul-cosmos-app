import Foundation

struct BirthInfo: Codable {
    var date: Date = Date()
    var time: Date = Date()
    var gender: Gender = .unknown
    var city: String = ""
    var longitude: Double = 120
    var latitude: Double = 39.9
    var mbtiType: String = ""

    enum Gender: String, Codable, CaseIterable {
        case male, female, unknown
        var label: String {
            switch self {
            case .male: return "男"
            case .female: return "女"
            case .unknown: return "未知"
            }
        }
    }

    var birthDateStr: String {
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; return f.string(from: date)
    }
    var birthTimeStr: String {
        let f = DateFormatter(); f.dateFormat = "HH:mm"; return f.string(from: time)
    }
}

struct MBTIType: Identifiable {
    let id = UUID()
    let code: String
    let name: String
    let desc: String
}

let MBTI_ALL: [MBTIType] = [
    .init(code: "INTJ", name: "建筑师", desc: "独立思考者，战略眼光"),
    .init(code: "INTP", name: "逻辑学家", desc: "好奇心强，热爱分析"),
    .init(code: "ENTJ", name: "指挥官", desc: "天生领导者，果断高效"),
    .init(code: "ENTP", name: "辩论家", desc: "创新思维，善于发现可能"),
    .init(code: "INFJ", name: "提倡者", desc: "洞察人心，追求意义"),
    .init(code: "INFP", name: "调停者", desc: "内心丰富，忠于价值观"),
    .init(code: "ENFJ", name: "主人公", desc: "善于激励，天生教练"),
    .init(code: "ENFP", name: "竞选者", desc: "热情创意，感染力强"),
    .init(code: "ISTJ", name: "物流师", desc: "可靠执行，注重细节"),
    .init(code: "ISFJ", name: "守卫者", desc: "温暖细心，默默付出"),
    .init(code: "ESTJ", name: "总经理", desc: "高效务实，注重秩序"),
    .init(code: "ESFJ", name: "执政官", desc: "热心助人，营造和谐"),
    .init(code: "ISTP", name: "鉴赏家", desc: "动手能力强，冷静分析"),
    .init(code: "ISFP", name: "探险家", desc: "审美敏锐，享受当下"),
    .init(code: "ESTP", name: "企业家", desc: "反应快，善于抓机会"),
    .init(code: "ESFP", name: "表演者", desc: "热情洋溢，享受生活"),
]
