workspace(name = 'imap')

load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

http_archive(
    name = "build_bazel_rules_typescript",
    url = "https://github.com/bazelbuild/rules_typescript/archive/0.23.2.zip",
    strip_prefix = "rules_typescript-0.23.2",
)

http_archive(
    name = "build_bazel_rules_nodejs",
    sha256 = "213dcf7e72f3acd4d1e369b7a356f3e5d9560f380bd655b13b7c0ea425d7c419",
    urls = ["https://github.com/bazelbuild/rules_nodejs/releases/download/0.27.9/rules_nodejs-0.27.9.tar.gz"],
)

http_archive(
    name = "io_bazel_rules_go",
    urls = ["https://github.com/bazelbuild/rules_go/releases/download/0.18.1/rules_go-0.18.1.tar.gz"],
    sha256 = "77dfd303492f2634de7a660445ee2d3de2960cbd52f97d8c0dffa9362d3ddef9",
)

http_archive(
    name = "bazel_gazelle",
    urls = ["https://github.com/bazelbuild/bazel-gazelle/releases/download/0.17.0/bazel-gazelle-0.17.0.tar.gz"],
    sha256 = "3c681998538231a2d24d0c07ed5a7658cb72bfb5fd4bf9911157c0e9ac6a2687",
)

# Setup the Node.js toolchain
load("@build_bazel_rules_nodejs//:defs.bzl", "npm_install")
npm_install(
    name = "npm",
    package_json = "//:package.json",
    package_lock_json = "//:package-lock.json",
)

load("@npm//:install_bazel_dependencies.bzl", "install_bazel_dependencies")
install_bazel_dependencies()

# Fetch our Bazel dependencies that aren't distributed on npm
# load("@build_bazel_rules_typescript//:package.bzl", "rules_typescript_dependencies")
# rules_typescript_dependencies()

# Setup TypeScript toolchain
load("@build_bazel_rules_typescript//:defs.bzl", "ts_setup_workspace")
ts_setup_workspace()