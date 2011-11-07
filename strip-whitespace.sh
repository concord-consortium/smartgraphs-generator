find src/ spec/ -not \( -name .git -prune \) -type f -print0 | xargs -0 sed -i '' -E "s/[[:space:]]*$//"
