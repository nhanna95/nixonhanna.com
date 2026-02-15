# Creating Blog Posts

This guide explains how to create new blog posts for your Jekyll site, including front matter configuration and Markdown syntax examples.

## Quick Start

1. Create a new file in the `_posts/` directory
2. Name it using the format: `YYYY-MM-DD-slug.md` (e.g., `2025-03-15-my-new-post.md`)
3. Add front matter at the top
4. Write your content in Markdown below the front matter
5. Save and commit - GitHub Actions will automatically deploy your post

## Front Matter

Every blog post must start with front matter (YAML configuration) between `---` markers:

```yaml
---
layout: post
title: "Your Post Title"
date: 2025-01-01
tags: [Tag1, Tag2]
---
```

### Required Fields

- **`layout: post`** - Always use `post` for blog posts
- **`title`** - Your post title (use quotes if it contains special characters)
- **`date`** - Publication date in `YYYY-MM-DD` format

### Optional Fields

- **`updated`** - Last updated date in `YYYY-MM-DD` format (displays "Updated on" date)
  ```yaml
  updated: 2025-01-15
  ```
- **`tags`** - Array of tags for filtering and categorization
  ```yaml
  tags: [Web Development, CSS, Tutorial]
  ```
  - Use multi-word tags with spaces (e.g., "Web Development")
  - Tags are case-sensitive but will be matched case-insensitively in search
  - Tags appear as clickable buttons on the post page that link to filtered blog listings
- **`substack`** - URL to the Substack version of the post (displays a notice at the top of the post)
  ```yaml
  substack: https://substack.com/@username/post-slug
  ```
- **`lesswrong`** - URL to the LessWrong version of the post (displays a notice at the top of the post)
  ```yaml
  lesswrong: https://www.lesswrong.com/posts/...
  ```

### Example Front Matter

```yaml
---
layout: post
title: "My First Blog Post"
date: 2025-03-15
updated: 2025-03-20
tags: [Introduction, Personal]
substack: https://substack.com/@username/post-slug
lesswrong: https://www.lesswrong.com/posts/...
---
```

## Markdown Syntax Guide

### Headings

```markdown
# Heading 1 (not typically used in posts)
## Heading 2 (main section)
### Heading 3 (subsection)
#### Heading 4 (sub-subsection)
```

### Paragraphs

Separate paragraphs with a blank line:

```markdown
This is the first paragraph.

This is the second paragraph.
```

### Links

#### Inline Links

```markdown
[Link text](https://example.com)
```

#### Links with Titles

```markdown
[Link text](https://example.com "Hover tooltip")
```

#### Internal Links (to pages on your site)

```markdown
[Contact page]({{ '/contact.html' | relative_url }})
[Blog page]({{ '/blog.html' | relative_url }})
[Another post]({{ '/2025/01/01/some-post.html' | relative_url }})
```

**Note:** Use Jekyll's `relative_url` filter for internal links to ensure they work correctly with your site's base URL.

#### Reference-Style Links

```markdown
[Link text][reference-id]

[reference-id]: https://example.com "Optional title"
```

### Images

```markdown
![Alt text](path/to/image.jpg)
![Alt text](path/to/image.jpg "Optional title")
```

#### External Images

```markdown
![Example](https://example.com/image.jpg)
```

#### Local Images

For images in your repository, place them in a directory (e.g., `images/`) and reference them:

```markdown
![Description]({{ '/images/my-image.jpg' | relative_url }})
```

### Text Formatting

```markdown
**bold text**
*italic text*
***bold and italic***
`inline code`
~~strikethrough~~
```

### Code Blocks

#### Inline Code

```markdown
Use `code` for inline snippets.
```

#### Code Blocks with Syntax Highlighting

Use triple backticks with a language identifier:

````markdown
```javascript
function hello() {
    console.log("Hello, world!");
}
```
````

Common language identifiers: `javascript`, `python`, `html`, `css`, `json`, `bash`, `yaml`, `markdown`

#### Code Blocks without Highlighting

````markdown
```
Plain code block
```
````

### Lists

#### Unordered Lists

```markdown
- Item 1
- Item 2
  - Nested item
  - Another nested item
- Item 3
```

#### Ordered Lists

```markdown
1. First item
2. Second item
3. Third item
```

#### Task Lists

```markdown
- [x] Completed task
- [ ] Incomplete task
```

### Blockquotes

```markdown
> This is a blockquote.
> It can span multiple lines.
>
> Multiple paragraphs in a blockquote.
```

### Horizontal Rules

```markdown
---
```

### Tables

```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Row 1    | Data     | Data     |
| Row 2    | Data     | Data     |
```

Alignment options:

```markdown
| Left | Center | Right |
|:-----|:------:|------:|
| Left | Center | Right |
```

### Line Breaks

Add two spaces at the end of a line for a line break:

```markdown
Line 1  
Line 2
```

Or use a blank line for a paragraph break.

### Escaping Special Characters

Use backslash to escape special Markdown characters:

```markdown
\*not italic\*
\# not a heading
```

## Complete Example Post

Here's a complete example of a blog post:

```markdown
---
layout: post
title: "Getting Started with Jekyll"
date: 2025-03-15
updated: 2025-03-20
tags: [Jekyll, Web Development, Tutorial]
---

## Introduction

This is a guide to creating blog posts with Jekyll and Markdown.

## Formatting Examples

Here's some **bold text** and *italic text*. You can also use `inline code`.

### Code Example

```javascript
function greet(name) {
    return `Hello, ${name}!`;
}
```

### Links

- [External link](https://example.com)
- [Internal link]({{ '/blog.html' | relative_url }})

### Lists

1. First item
2. Second item
   - Nested item
   - Another nested item

### Blockquote

> "The best way to learn is by doing."

---

That's it! Happy blogging!
```

## Tips and Best Practices

1. **File Naming**: Use descriptive slugs in filenames (e.g., `2025-03-15-getting-started-with-jekyll.md`)

2. **Dates**: Always use the `YYYY-MM-DD` format for dates

3. **Titles**: Keep titles concise but descriptive. They appear in:
   - The blog listing page
   - The post page header
   - Browser tab titles
   - Search results

4. **Tags**: 
   - Use consistent tag naming (e.g., "Web Development" not "web development" or "WebDev")
   - Use 2-5 tags per post for best discoverability
   - Tags are case-sensitive but search is case-insensitive

5. **Content**:
   - Use headings to structure your content
   - Break up long paragraphs
   - Use code blocks for technical examples
   - Add images to illustrate points

6. **Updated Dates**: Only include `updated` if you've made substantive changes after publication

7. **Internal Links**: Always use Jekyll's `relative_url` filter for internal links:
   ```markdown
   [Link text]({{ '/path/to/page.html' | relative_url }})
   ```

## Previewing Your Post

1. **Local Development**: Run `bundle exec jekyll serve` and visit `http://localhost:4000`
2. **GitHub Actions**: Push to `main` branch and wait for automatic deployment
3. **Live Site**: Check your site at `https://nixonhanna.com` after deployment

## Troubleshooting

### Post Not Appearing
- Check the filename format (`YYYY-MM-DD-slug.md`)
- Ensure the file is in the `_posts/` directory
- Verify the date is not in the future
- Check for syntax errors in front matter (YAML)

### Images Not Loading
- Ensure image paths use `relative_url` filter
- Check that image files are committed to the repository
- Verify image paths are correct relative to the site root

### Links Not Working
- Use `relative_url` filter for internal links
- Check that the target page exists
- Verify the path is correct

### Tags Not Showing
- Ensure tags are in array format: `tags: [Tag1, Tag2]`
- Check for typos in tag names
- Tags are case-sensitive

