# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - heading "Create your account" [level=2] [ref=e6]
    - paragraph [ref=e7]:
      - text: Or
      - link "sign in to your existing account" [ref=e8]:
        - /url: /login
  - generic [ref=e9]:
    - generic [ref=e10]:
      - generic [ref=e11]:
        - generic [ref=e12]: Email address
        - textbox "Enter your email" [active] [ref=e13]
        - paragraph [ref=e14]: Invalid email address
      - generic [ref=e15]:
        - generic [ref=e16]: Role
        - combobox [ref=e17]:
          - option "Select your role" [selected]
          - option "Buyer"
          - option "Supplier"
        - paragraph [ref=e18]: Please select a role
      - generic [ref=e19]:
        - generic [ref=e20]: Password
        - textbox "Enter your password" [ref=e21]
        - paragraph [ref=e22]: Password is required
      - generic [ref=e23]:
        - generic [ref=e24]: Confirm Password
        - textbox "Confirm your password" [ref=e25]
        - paragraph [ref=e26]: Password is required
    - button "Create account" [ref=e28] [cursor=pointer]
```