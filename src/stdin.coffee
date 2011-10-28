# echo stdin by running the command:
# node lib/stdin.js
stdin = process.openStdin()
stdin.on 'data', (data) -> console.log data.toString()
