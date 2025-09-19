# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - heading "Sign in to your account" [level=2] [ref=e6]
    - paragraph [ref=e7]:
      - text: Or
      - link "create a new account" [ref=e8] [cursor=pointer]:
        - /url: /register
  - generic [ref=e9]:
    - generic [ref=e10]: Invalid credentials
    - generic [ref=e11]:
      - generic [ref=e12]:
        - generic [ref=e13]: Email address
        - textbox "Enter your email" [ref=e14]: supplier@example.com
      - generic [ref=e15]:
        - generic [ref=e16]: Password
        - textbox "Enter your password" [ref=e17]: supplierpass123
    - button "Sign in" [ref=e19] [cursor=pointer]
```