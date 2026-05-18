import SwiftUI

struct SettingsView: View {
    @AppStorage("api_base_url") private var apiBase = "http://localhost:8066"
    @AppStorage("app_language") private var language = "zh"

    var body: some View {
        ZStack {
            Color.cosmosCanvas.ignoresSafeArea()

            Form {
                Section {
                    HStack {
                        Text("API 地址")
                            .foregroundColor(.cosmosTextPrimary)
                        TextField("http://localhost:8066", text: $apiBase)
                            .textFieldStyle(.plain)
                            .foregroundColor(.cosmosTextSecondary)
                            .autocapitalization(.none)
                            .disableAutocorrection(true)
                    }

                    Picker("语言", selection: $language) {
                        Text("中文").tag("zh")
                        Text("English").tag("en")
                    }
                } header: {
                    Text("通用设置")
                }

                Section {
                    HStack {
                        Text("版本")
                            .foregroundColor(.cosmosTextPrimary)
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(.cosmosTextMuted)
                    }
                } header: {
                    Text("关于")
                }
            }
            .scrollContentBackground(.hidden)
        }
        .navigationTitle("设置")
    }
}
