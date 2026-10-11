// 행운 아이템 후보 목록
// 위젯에는 코드처럼 `lucky_status = "200 OK"` 모양으로 표시된다.
// key는 위젯에 보이는 이름, values는 그날 하나가 뽑히는 후보들이다.

export const luckyCategories = [
  {
    key: 'lucky_status', // 행운의 상태코드
    values: [
      '100 Continue', '101 Switching Protocols', '103 Early Hints',
      '200 OK', '201 Created', '202 Accepted', '204 No Content',
      '206 Partial Content', '207 Multi-Status', '226 IM Used',
      '301 Moved Permanently', '302 Found', '304 Not Modified',
      '308 Permanent Redirect', "418 I'm a teapot",
    ],
  },
  {
    key: 'lucky_shortcut', // 행운의 단축키
    values: [
      'Ctrl+Z', 'Ctrl+S', 'Cmd+S', 'Ctrl+Shift+P', 'Cmd+P', 'Ctrl+C',
      'Ctrl+R', 'Alt+Up', 'Cmd+D', 'Ctrl+/', 'Cmd+Shift+F', 'F5',
      'Ctrl+`', 'Cmd+K', 'Ctrl+Shift+T',
    ],
  },
  {
    key: 'lucky_language', // 행운의 언어
    values: [
      'Rust', 'Python', 'TypeScript', 'Go', 'Kotlin', 'Swift', 'Java',
      'C', 'C++', 'Ruby', 'Elixir', 'Haskell', 'Zig', 'Lua', 'Scala',
      'Dart', 'JavaScript', 'C#', 'PHP', 'OCaml',
    ],
  },
  {
    key: 'lucky_command', // 행운의 명령어
    values: [
      'git stash', 'git commit --amend', 'git rebase -i', 'git log --oneline',
      'npm ci', 'rm -rf node_modules', 'docker compose up', 'git pull --rebase',
      'make', 'ls -la', 'git switch -c', 'npm test', 'git cherry-pick',
      'history | grep', 'brew update', 'cd ..',
    ],
  },
];

// 하루에 보여줄 행운 아이템 개수 (네 종류 중 일부만 보여준다)
export const LUCKY_PER_DAY = 2;
