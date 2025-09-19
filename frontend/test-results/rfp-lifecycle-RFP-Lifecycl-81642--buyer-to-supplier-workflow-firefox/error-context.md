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
    - generic [ref=e10]: Email already registered
    - generic [ref=e11]:
      - generic [ref=e12]:
        - generic [ref=e13]: Email address
        - textbox "Enter your email" [ref=e14]: buyer@example.com
      - generic [ref=e15]:
        - generic [ref=e16]: Role
        - combobox [ref=e17]:
          - option "Select your role"
          - option "Buyer" [selected]
          - option "Supplier"
      - generic [ref=e18]:
        - generic [ref=e19]: Password
        - textbox "Enter your password" [ref=e20]: buyerpass123
      - generic [ref=e21]:
        - generic [ref=e22]: Confirm Password
        - textbox "Confirm your password" [ref=e23]: buyerpass123
    - button "Create account" [ref=e25] [cursor=pointer]
```