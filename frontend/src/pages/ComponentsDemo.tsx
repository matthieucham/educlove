import { useState } from 'react'
import {
    Button,
    Input,
    Card,
    Modal,
    ConfirmModal,
    Select,
    MultiSelect,
    Badge,
    Chip,
    Avatar,
    AvatarGroup,
    Loading,
    Spinner,
    Skeleton,
    ProgressBar,
    LoadingDots
} from '../components/ui'
import type { SelectOption } from '../components/ui'

const ComponentsDemo = () => {
    const [modalOpen, setModalOpen] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const [selectValue, setSelectValue] = useState('')
    const [multiSelectValue, setMultiSelectValue] = useState<string[]>([])
    const [progress, setProgress] = useState(60)

    const selectOptions: SelectOption[] = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
        { value: 'option3', label: 'Option 3' },
        { value: 'option4', label: 'Option 4 (disabled)', disabled: true }
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <h1 className="text-4xl font-bold text-gray-800 mb-8">EducLove UI Components Demo</h1>

                {/* Buttons Section */}
                <Card>
                    <Card.Header>
                        <Card.Title>Buttons</Card.Title>
                        <Card.Description>Various button styles and states</Card.Description>
                    </Card.Header>
                    <Card.Content>
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                <Button variant="primary">Primary</Button>
                                <Button variant="secondary">Secondary</Button>
                                <Button variant="outline">Outline</Button>
                                <Button variant="ghost">Ghost</Button>
                                <Button variant="danger">Danger</Button>
                                <Button variant="success">Success</Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button size="sm">Small</Button>
                                <Button size="md">Medium</Button>
                                <Button size="lg">Large</Button>
                                <Button size="xl">Extra Large</Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button loading>Loading</Button>
                                <Button disabled>Disabled</Button>
                                <Button fullWidth>Full Width</Button>
                            </div>
                        </div>
                    </Card.Content>
                </Card>

                {/* Input Section */}
                <Card>
                    <Card.Header>
                        <Card.Title>Input Fields</Card.Title>
                        <Card.Description>Form inputs with various states</Card.Description>
                    </Card.Header>
                    <Card.Content>
                        <div className="space-y-4 max-w-md">
                            <Input
                                label="Basic Input"
                                placeholder="Enter text..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                            />
                            <Input
                                label="Required Input"
                                placeholder="This field is required"
                                required
                            />
                            <Input
                                label="Input with Error"
                                placeholder="Invalid input"
                                error="This field has an error"
                            />
                            <Input
                                label="Input with Helper Text"
                                placeholder="Enter password"
                                type="password"
                                helperText="Must be at least 8 characters"
                            />
                            <Input
                                label="Disabled Input"
                                placeholder="Cannot edit"
                                disabled
                            />
                        </div>
                    </Card.Content>
                </Card>

                {/* Select Section */}
                <Card>
                    <Card.Header>
                        <Card.Title>Select Components</Card.Title>
                        <Card.Description>Dropdown and multi-select components</Card.Description>
                    </Card.Header>
                    <Card.Content>
                        <div className="space-y-4 max-w-md">
                            <Select
                                label="Single Select"
                                options={selectOptions}
                                value={selectValue}
                                onChange={(e) => setSelectValue(e.target.value)}
                                placeholder="Choose an option..."
                            />
                            <MultiSelect
                                label="Multi Select"
                                options={selectOptions}
                                value={multiSelectValue}
                                onChange={setMultiSelectValue}
                            />
                        </div>
                    </Card.Content>
                </Card>

                {/* Badges and Chips Section */}
                <Card>
                    <Card.Header>
                        <Card.Title>Badges & Chips</Card.Title>
                        <Card.Description>Small informational components</Card.Description>
                    </Card.Header>
                    <Card.Content>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Badges</h3>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="default">Default</Badge>
                                    <Badge variant="primary">Primary</Badge>
                                    <Badge variant="secondary">Secondary</Badge>
                                    <Badge variant="success">Success</Badge>
                                    <Badge variant="warning">Warning</Badge>
                                    <Badge variant="danger">Danger</Badge>
                                    <Badge variant="info">Info</Badge>
                                    <Badge variant="primary" rounded>Rounded</Badge>
                                    <Badge variant="success" removable onRemove={() => console.log('Removed')}>
                                        Removable
                                    </Badge>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Chips</h3>
                                <div className="flex flex-wrap gap-2">
                                    <Chip label="Default Chip" />
                                    <Chip label="Primary" color="primary" variant="filled" />
                                    <Chip label="Outlined" variant="outlined" />
                                    <Chip label="Clickable" clickable onClick={() => console.log('Clicked')} />
                                    <Chip label="Deletable" deletable onDelete={() => console.log('Deleted')} />
                                    <Chip label="Selected" selected />
                                </div>
                            </div>
                        </div>
                    </Card.Content>
                </Card>

                {/* Avatar Section */}
                <Card>
                    <Card.Header>
                        <Card.Title>Avatars</Card.Title>
                        <Card.Description>User avatar components</Card.Description>
                    </Card.Header>
                    <Card.Content>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Avatar size="xs" fallback="XS" />
                                <Avatar size="sm" fallback="SM" />
                                <Avatar size="md" fallback="MD" />
                                <Avatar size="lg" fallback="LG" />
                                <Avatar size="xl" fallback="XL" />
                                <Avatar size="2xl" fallback="2X" />
                            </div>
                            <div className="flex items-center gap-4">
                                <Avatar fallback="JD" status="online" />
                                <Avatar fallback="AB" status="offline" />
                                <Avatar fallback="CD" status="away" />
                                <Avatar fallback="EF" status="busy" />
                            </div>
                            <div className="flex items-center gap-4">
                                <Avatar fallback="SQ" shape="square" />
                                <Avatar fallback="CI" shape="circle" />
                                <Avatar fallback="Marie Dupont" size="lg" />
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Avatar Group</h3>
                                <AvatarGroup max={3}>
                                    <Avatar fallback="U1" />
                                    <Avatar fallback="U2" />
                                    <Avatar fallback="U3" />
                                    <Avatar fallback="U4" />
                                    <Avatar fallback="U5" />
                                </AvatarGroup>
                            </div>
                        </div>
                    </Card.Content>
                </Card>

                {/* Loading States Section */}
                <Card>
                    <Card.Header>
                        <Card.Title>Loading States</Card.Title>
                        <Card.Description>Various loading indicators</Card.Description>
                    </Card.Header>
                    <Card.Content>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Spinners</h3>
                                <div className="flex items-center gap-4">
                                    <Spinner size="xs" />
                                    <Spinner size="sm" />
                                    <Spinner size="md" />
                                    <Spinner size="lg" />
                                    <Spinner size="xl" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Loading Dots</h3>
                                <div className="flex items-center gap-4">
                                    <LoadingDots size="sm" />
                                    <LoadingDots size="md" />
                                    <LoadingDots size="lg" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Skeletons</h3>
                                <div className="space-y-2">
                                    <Skeleton variant="text" />
                                    <Skeleton variant="text" width="60%" />
                                    <div className="flex gap-2">
                                        <Skeleton variant="circular" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton variant="text" />
                                            <Skeleton variant="text" width="80%" />
                                        </div>
                                    </div>
                                    <Skeleton variant="rectangular" height={100} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Progress Bar</h3>
                                <div className="space-y-2">
                                    <ProgressBar value={progress} showLabel />
                                    <ProgressBar value={75} color="success" />
                                    <ProgressBar value={50} color="warning" />
                                    <ProgressBar value={25} color="danger" animated />
                                    <Button
                                        size="sm"
                                        onClick={() => setProgress((p) => Math.min(p + 10, 100))}
                                    >
                                        Increase Progress
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card.Content>
                </Card>

                {/* Modal Section */}
                <Card>
                    <Card.Header>
                        <Card.Title>Modals</Card.Title>
                        <Card.Description>Dialog and confirmation modals</Card.Description>
                    </Card.Header>
                    <Card.Content>
                        <div className="flex gap-2">
                            <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
                            <Button variant="danger" onClick={() => setConfirmOpen(true)}>
                                Open Confirm Modal
                            </Button>
                        </div>
                    </Card.Content>
                </Card>

                {/* Card Variants */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card variant="default">
                        <Card.Content>Default Card</Card.Content>
                    </Card>
                    <Card variant="bordered">
                        <Card.Content>Bordered Card</Card.Content>
                    </Card>
                    <Card variant="elevated">
                        <Card.Content>Elevated Card</Card.Content>
                    </Card>
                    <Card variant="gradient">
                        <Card.Content>Gradient Card</Card.Content>
                    </Card>
                </div>

                {/* Modals */}
                <Modal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    title="Example Modal"
                    description="This is a demonstration of the modal component"
                    size="md"
                >
                    <div className="space-y-4">
                        <p>This is the modal content. You can put any content here.</p>
                        <Input label="Example Input" placeholder="Type something..." />
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={() => setModalOpen(false)}>
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </Modal>

                <ConfirmModal
                    isOpen={confirmOpen}
                    onClose={() => setConfirmOpen(false)}
                    onConfirm={() => {
                        console.log('Confirmed!')
                        setConfirmOpen(false)
                    }}
                    title="Confirm Action"
                    message="Are you sure you want to proceed with this action? This cannot be undone."
                    variant="danger"
                />
            </div>
        </div>
    )
}

export default ComponentsDemo
