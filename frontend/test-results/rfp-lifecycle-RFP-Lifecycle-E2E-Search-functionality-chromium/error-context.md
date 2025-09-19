# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation [ref=e4]:
    - generic [ref=e6]:
      - generic [ref=e7]:
        - link "RFP Management" [ref=e8] [cursor=pointer]:
          - /url: /
        - generic [ref=e9]:
          - link "Dashboard" [ref=e10] [cursor=pointer]:
            - /url: /
          - link "Search" [ref=e11] [cursor=pointer]:
            - /url: /search
      - generic [ref=e12]:
        - generic [ref=e13]: buyer@example.com (buyer)
        - button "Logout" [ref=e14] [cursor=pointer]
  - main [ref=e15]:
    - generic [ref=e19]:
      - heading "Search RFPs" [level=1] [ref=e20]
      - generic [ref=e21]:
        - textbox "Search RFPs by title, description, or requirements..." [ref=e23]: E2E Test
        - button "Search" [active] [ref=e24] [cursor=pointer]
      - generic [ref=e25]:
        - button "All" [ref=e26] [cursor=pointer]
        - button "Published" [ref=e27] [cursor=pointer]
        - button "Response Submitted" [ref=e28] [cursor=pointer]
        - button "Under Review" [ref=e29] [cursor=pointer]
```