// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    id("com.android.application") version "8.7.2" apply false
    id("org.jetbrains.kotlin.android") version "2.0.21" apply false
}

tasks.register("clean", Delete::class) {
    delete(rootProject.layout.buildDirectory)
}

// Ensure the Node dev server is running on port 3000 for the web preview
gradle.projectsEvaluated {
    try {
        val socket = java.net.Socket()
        socket.connect(java.net.InetSocketAddress("127.0.0.1", 3000), 400)
        socket.close()
    } catch (e: Exception) {
        println("Port 3000 not active, starting Node dev server...")
        try {
            ProcessBuilder("node", "server.js")
                .directory(rootProject.rootDir)
                .start()
        } catch (err: Exception) {
            println("Could not start node server: ${err.message}")
        }
    }
}
