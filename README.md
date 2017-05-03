# PROCONFileAPI

[![Greenkeeper badge](https://badges.greenkeeper.io/3846masa/YEHD-2015-ProconServer.svg)](https://greenkeeper.io/)
File-based Procon-Question Serving API.

## How to use
- Clone project.
- ``npm install``
- Create ``questions`` folder in project root.
- Put questions folloing below.
  - ``questionList.json`` is JSON Array of folders.
    - If not exist, create dynamically
  - Folder is ``{Points}-{QuestionName}``
  - ``README.md`` is description of question.
    - Path in .md should be relateive path.
  - ``data/*.q`` is STDIN input data.
  - ``data/*.ans`` is answer data.
  - ``README.md`` are required.

```
questions/
  |--- questionList.json
  |--- 100-ProblemA
  |   |- README.md
  |   |- data
  |      |- 01.q
  |      |- 02.q
  |      |- 01.ans
  |      |- 02.ans
  |--- 050-ProblemB
      |- README.md
      |- data
         |- 01.q
         |- 02.q
         |- 01.ans
         |- 02.ans
```

- Then, ``npm start``.

## API (json)
- GET ``/api/status``
  - Server status.
- GET/POST ``/api/scores``
  - All Users and Scores
  - ``Content-Type: application/json`` is required if you post
- POST ``/api/auth``
  - Login
  - ``Content-Type: application/json`` is required
- POST ``/api/signup``
  - Signup
  - ``Content-Type: application/json`` is required
- GET ``/api/logout``
  - Logout
- GET ``/api/user``
  - User Info if you passed auth
- GET ``/api/users``
  - All users Info
- POST ``/api/submit``
  - You submit flag
  - ``Content-Type: application/json`` is required
  - Example
    ```json
    {
      "question": "Misc-100-Hello",
      "lang": "perl",
      "code": "print \"Hello,World!\\n\";"
    }
    ```
- GET ``/{staticFilePath}``
  - Example: ``/100-ProblemA/README.md``
