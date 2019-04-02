package(default_visibility = ["//visibility:public"])

load("@build_bazel_rules_typescript//:defs.bzl", "ts_library", "ts_config")

ts_config(
    name = "tsconfig",
    deps = [],
    src = "tsconfig.json"
)

ts_library(
    name = "app",
    srcs = glob(["source/*.ts"]),
    deps = [
        ":tsconfig"
    ]
)

load("@build_bazel_rules_nodejs//:defs.bzl", "nodejs_binary")

nodejs_binary(
    name = "imap",
    entry_point = "./dist/index.js"
)