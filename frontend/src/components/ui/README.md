# EducLove UI Components Library

A comprehensive collection of reusable React components built with TypeScript and Tailwind CSS for the EducLove application.

## 📦 Installation

All components are already set up in the project. To use them, simply import from the UI components directory:

```typescript
import { Button, Card, Input } from '@/components/ui'
```

## 🎨 Design System

Our components follow the EducLove design system with:
- **Primary Colors**: Purple to Pink gradient (`from-purple-600 to-pink-600`)
- **Typography**: Clean, modern sans-serif fonts
- **Spacing**: Consistent padding and margins using Tailwind's spacing scale
- **Shadows**: Subtle shadows for depth
- **Border Radius**: Rounded corners for a friendly appearance

## 📚 Components

### Button

A versatile button component with multiple variants and sizes.

```tsx
import { Button } from '@/components/ui'

// Basic usage
<Button>Click me</Button>

// Variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Danger</Button>
<Button variant="success">Success</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>

// With icons
<Button leftIcon={<Icon />}>With Icon</Button>

// Loading state
<Button loading>Loading...</Button>

// Full width
<Button fullWidth>Full Width Button</Button>
```

### Input

Form input component with validation support.

```tsx
import { Input } from '@/components/ui'

// Basic usage
<Input placeholder="Enter text" />

// With label and error
<Input
  label="Email"
  type="email"
  error="Invalid email address"
  required
/>

// With helper text
<Input
  label="Password"
  type="password"
  helperText="Must be at least 8 characters"
/>

// With icons
<Input
  leftIcon={<MailIcon />}
  placeholder="Email"
/>
```

### Card

Flexible card component with compound components.

```tsx
import { Card } from '@/components/ui'

// Basic card
<Card>
  <Card.Header>
    <Card.Title>Card Title</Card.Title>
    <Card.Description>Card description</Card.Description>
  </Card.Header>
  <Card.Content>
    Card content goes here
  </Card.Content>
  <Card.Footer>
    <Button>Action</Button>
  </Card.Footer>
</Card>

// Variants
<Card variant="bordered">Bordered Card</Card>
<Card variant="elevated">Elevated Card</Card>
<Card variant="gradient">Gradient Card</Card>
```

### Modal

Modal dialog component with accessibility features.

```tsx
import { Modal, ConfirmModal } from '@/components/ui'

// Basic modal
const [isOpen, setIsOpen] = useState(false)

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  description="Modal description"
>
  Modal content
</Modal>

// Confirmation modal
<ConfirmModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onConfirm={handleConfirm}
  title="Confirm Action"
  message="Are you sure you want to proceed?"
  variant="danger"
/>
```

### Select

Dropdown select component with single and multi-select options.

```tsx
import { Select, MultiSelect } from '@/components/ui'

// Single select
<Select
  label="Choose an option"
  options={[
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' }
  ]}
  value={selectedValue}
  onChange={(e) => setSelectedValue(e.target.value)}
/>

// Multi-select
<MultiSelect
  label="Select multiple"
  options={options}
  value={selectedValues}
  onChange={setSelectedValues}
/>
```

### Badge & Chip

Small components for displaying tags and status.

```tsx
import { Badge, Chip } from '@/components/ui'

// Badge
<Badge variant="primary">New</Badge>
<Badge variant="success" rounded>Active</Badge>
<Badge removable onRemove={handleRemove}>Removable</Badge>

// Chip
<Chip
  label="Category"
  color="primary"
  clickable
  onClick={handleClick}
/>
<Chip
  label="User"
  avatar={<img src="avatar.jpg" />}
  deletable
  onDelete={handleDelete}
/>
```

### Avatar

User avatar component with fallback support.

```tsx
import { Avatar, AvatarGroup } from '@/components/ui'

// Basic avatar
<Avatar src="user.jpg" alt="User Name" />

// With fallback initials
<Avatar fallback="JD" />

// With status indicator
<Avatar
  src="user.jpg"
  status="online"
  size="lg"
/>

// Avatar group
<AvatarGroup max={3}>
  <Avatar src="user1.jpg" />
  <Avatar src="user2.jpg" />
  <Avatar src="user3.jpg" />
  <Avatar src="user4.jpg" />
</AvatarGroup>
```

### Loading

Various loading indicators and skeletons.

```tsx
import { Loading, Spinner, Skeleton, ProgressBar } from '@/components/ui'

// Spinner
<Spinner size="lg" color="primary" />

// Loading overlay
<LoadingOverlay message="Loading data..." />

// Skeleton loader
<Skeleton variant="text" />
<Skeleton variant="circular" width={40} height={40} />
<Skeleton variant="rectangular" height={200} />

// Progress bar
<ProgressBar
  value={60}
  max={100}
  color="primary"
  showLabel
  animated
/>

// Loading dots
<LoadingDots size="md" color="primary" />
```

## 🎯 Best Practices

### Accessibility
- All components include proper ARIA attributes
- Keyboard navigation support
- Focus management for modals and dropdowns
- Screen reader friendly

### Performance
- Components are optimized with React.memo where appropriate
- Lazy loading support
- Minimal re-renders

### Styling
- Use the `cn()` utility for combining classes
- Leverage Tailwind's utility classes
- Maintain consistent spacing and colors

### TypeScript
- All components are fully typed
- Export interfaces for props
- Use generic types where applicable

## 🧪 Testing Components

When testing components in your pages:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui'

test('Button renders and handles click', () => {
  const handleClick = jest.fn()
  render(<Button onClick={handleClick}>Click me</Button>)
  
  const button = screen.getByText('Click me')
  fireEvent.click(button)
  
  expect(handleClick).toHaveBeenCalled()
})
```

## 📝 Examples

### Login Form Example

```tsx
import { Card, Input, Button } from '@/components/ui'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  return (
    <Card variant="elevated">
      <Card.Header>
        <Card.Title>Se connecter</Card.Title>
      </Card.Header>
      <Card.Content>
        <form className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button
            type="submit"
            fullWidth
            loading={loading}
          >
            Se connecter
          </Button>
        </form>
      </Card.Content>
    </Card>
  )
}
```

### Profile Card Example

```tsx
import { Card, Avatar, Badge, Button } from '@/components/ui'

function ProfileCard({ user }) {
  return (
    <Card variant="gradient">
      <Card.Content>
        <div className="flex items-center space-x-4">
          <Avatar
            src={user.avatar}
            fallback={user.name}
            size="xl"
            status="online"
          />
          <div>
            <h3 className="text-lg font-semibold">{user.name}</h3>
            <p className="text-gray-600">{user.role}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="primary">{user.subject}</Badge>
              <Badge variant="success">{user.experience} ans</Badge>
            </div>
          </div>
        </div>
      </Card.Content>
      <Card.Footer>
        <Button variant="outline" size="sm">
          Voir le profil
        </Button>
        <Button variant="primary" size="sm">
          Envoyer un message
        </Button>
      </Card.Footer>
    </Card>
  )
}
```

## 🔧 Customization

All components accept a `className` prop for additional styling:

```tsx
<Button className="custom-class">Custom Button</Button>
```

You can also extend components by wrapping them:

```tsx
const PrimaryButton = (props) => (
  <Button variant="primary" size="lg" {...props} />
)
```

## 📄 License

This component library is part of the EducLove project and follows the same license terms.
