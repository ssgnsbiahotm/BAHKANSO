import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      filter: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

// Mock React Router
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/app/surveillance' }),
  BrowserRouter: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Toast
vi.mock('@/lib/Toast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

// Mock AuthContext
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({
    session: null,
    authUser: null,
    appUser: { id: 'test-user-id', name: 'Test User', auth_id: 'test-auth-id', farm_id: 'test-farm-id' },
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPassword: vi.fn(),
    updatePassword: vi.fn(),
    refreshAppUser: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock DataContext
vi.mock('@/lib/DataContext', () => ({
  useData: () => ({
    siteContent: { branding: { value: {} } },
    farm: { id: 'test-farm-id', name: 'Test Farm' },
  }),
}));

// Mock useAsyncAction
vi.mock('@/hooks/useAsyncAction', () => ({
  useAsyncAction: () => ({
    loading: false,
    executeAction: vi.fn(async (fn: () => Promise<unknown>) => fn()),
  }),
}));

// Mock react-query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({
    data: { data: [], count: 0, page: 1, pageSize: 50, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  })),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
  })),
  QueryClient: vi.fn(() => ({
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
    invalidateQueries: vi.fn(),
  })),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
  keepPreviousData: undefined,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ShieldAlert: () => <span data-testid="icon-shield-alert" />,
  Wrench: () => <span data-testid="icon-wrench" />,
  Calendar: () => <span data-testid="icon-calendar" />,
  Euro: () => <span data-testid="icon-euro" />,
  User: () => <span data-testid="icon-user" />,
  AlertTriangle: () => <span data-testid="icon-alert-triangle" />,
  RotateCcw: () => <span data-testid="icon-rotate-ccw" />,
  Edit2: () => <span data-testid="icon-edit" />,
  Trash2: () => <span data-testid="icon-trash" />,
  CheckCircle: () => <span data-testid="icon-check-circle" />,
  X: () => <span data-testid="icon-x" />,
  Plus: () => <span data-testid="icon-plus" />,
  ChevronLeft: () => <span data-testid="icon-chevron-left" />,
  ChevronRight: () => <span data-testid="icon-chevron-right" />,
  Loader2: () => <span data-testid="icon-loader" />,
  Search: () => <span data-testid="icon-search" />,
}));

// Mock @/components/ui
vi.mock('@/components/ui', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props} data-testid="button">{children}</button>
  ),
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} data-testid="input" />,
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} data-testid="textarea" />,
  Select: (props: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...props} data-testid="select" />,
  Card: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props} data-testid="card">{children}</div>,
  CardHeader: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props} data-testid="card-header">{children}</div>,
  CardTitle: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <h3 {...props} data-testid="card-title">{children}</h3>,
  CardContent: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props} data-testid="card-content">{children}</div>,
  Badge: ({ children, className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
    <span {...props} className={className} data-testid="badge">{children}</span>
  ),
  Label: ({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => <label {...props} data-testid="label">{children}</label>,
  Dialog: ({ open, onOpenChange, children, ...props }: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }) => (
    open ? <div {...props} data-testid="dialog">{children}</div> : null
  ),
  Modal: ({ open, onClose, children, ...props }: { open: boolean; onClose: () => void; children: React.ReactNode }) => (
    open ? <div {...props} data-testid="modal">{children}</div> : null
  ),
  DialogTrigger: ({ children, ...props }: { children: React.ReactNode }) => <div {...props} data-testid="dialog-trigger">{children}</div>,
  DialogContent: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props} data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props} data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <h2 {...props} data-testid="dialog-title">{children}</h2>,
  DialogDescription: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <p {...props} data-testid="dialog-description">{children}</p>,
  DialogFooter: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props} data-testid="dialog-footer">{children}</div>,
  DialogClose: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props} data-testid="dialog-close">{children}</button>,
}));

// Mock @/hooks/useValidatedForm
vi.mock('@/hooks/useValidatedForm', () => ({
  useValidatedForm: () => ({
    form: {
      register: vi.fn(),
      handleSubmit: vi.fn((fn) => async (e: React.FormEvent) => { e.preventDefault(); await fn({}); }),
      setValue: vi.fn(),
      watch: vi.fn(() => ({})),
      reset: vi.fn(),
      formState: { errors: {}, isSubmitting: false },
    },
    errors: {},
    isSubmitting: false,
    handleSubmit: vi.fn(),
    register: vi.fn(),
    setValue: vi.fn(),
    watch: vi.fn(() => ({})),
    reset: vi.fn(),
  }),
}));

// Mock @/components/layout/Sidebar
vi.mock('@/components/layout/Sidebar', () => ({
  Sidebar: ({ children }: { children: React.ReactNode }) => <div data-testid="sidebar">{children}</div>,
}));

// Mock @/components/ui/Logo
vi.mock('@/components/ui/Logo', () => ({
  Logo: () => <div data-testid="logo" />,
}));

console.log('Test setup loaded');