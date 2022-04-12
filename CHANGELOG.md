# CHANGELOG

## 1.1.0

-   Adds more options for languages that do not enforce parentheses when calling functions

    -   `usePrefixSpace` (defaults to `false`) adds a space to the variable prefix. In a language like ruby, print statements do not add a space and will output something like `"VariableNameVariableValue"`. Setting this to true will make it prettier `"VariableName VariableValue"`

    -   `useParentheses` (defaults to `true`)

        example ruby config:

        ```json
        "[ruby]": {
            "wrap-log-simple.functionName": "print",
            "wrap-log-simple.useSemicolon": false,
            "wrap-log-simple.useParentheses": false,
            "wrap-log-simple.usePrefixSpace": true
        },
        ```

        outputs:

        ```ruby
        lang = "ruby"
        print lang # alt + L
        print "lang ", lang # cmd + L
        ```

---

## 1.0.2

##### 2022-04-08

-   Initial release
