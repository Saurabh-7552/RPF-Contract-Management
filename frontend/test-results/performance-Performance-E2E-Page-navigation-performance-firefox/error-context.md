# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - heading "Create your account" [level=2] [ref=e6]
    - paragraph [ref=e7]:
      - text: Or
      - link "sign in to your existing account" [ref=e8] [cursor=pointer]:
        - /url: /login
  - generic [ref=e9]:
    - generic [ref=e10]:
      - generic [ref=e11]:
        - generic [ref=e12]: Email address
        - textbox "Enter your email" [ref=e13]
      - generic [ref=e14]:
        - generic [ref=e15]: Role
        - combobox [ref=e16]:
          - option "Select your role" [selected]
          - option "Buyer"
          - option "Supplier"
      - generic [ref=e17]:
        - generic [ref=e18]: Password
        - textbox "Enter your password" [ref=e19]
      - generic [ref=e20]:
        - generic [ref=e21]: Confirm Password
        - textbox "Confirm your password" [ref=e22]
    - button "Create account" [ref=e24] [cursor=pointer]
```