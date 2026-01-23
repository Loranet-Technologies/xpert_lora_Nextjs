'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Settings,
  Trash2,
  Plus,
  Loader2,
  Search,
  CreditCard,
  Key,
  Globe,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import Header from '@/components/header';
import { DataTable } from '@/components/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Types
type Merchant = {
  id: string;
  name: string;
  merchant_id: string;
  currency: string;
  status: 'active' | 'inactive' | 'pending';
};

type PaymentGatewayAccount = {
  id: string;
  merchant_id: string;
  merchant_name?: string;
  api_key: string;
  merchant_secret: string;
  environment: 'sandbox' | 'production';
  is_default: boolean;
};

type PaymentGateway = {
  id: string;
  payment_gateway_name: string;
  provider: string;
  supports_webhook: boolean;
};

// Fake data generators
const generateFakeMerchants = (): Merchant[] => [
  { id: '1', name: 'Acme Corporation', merchant_id: 'MERCH-001', currency: 'USD', status: 'active' },
  { id: '2', name: 'Tech Solutions Ltd', merchant_id: 'MERCH-002', currency: 'EUR', status: 'active' },
  { id: '3', name: 'Global Trading Co', merchant_id: 'MERCH-003', currency: 'GBP', status: 'inactive' },
  { id: '4', name: 'Digital Services Inc', merchant_id: 'MERCH-004', currency: 'USD', status: 'pending' },
  { id: '5', name: 'Retail Partners Group', merchant_id: 'MERCH-005', currency: 'CAD', status: 'active' },
];

const generateFakePaymentGatewayAccounts = (merchants: Merchant[]): PaymentGatewayAccount[] => [
  {
    id: '1',
    merchant_id: 'MERCH-001',
    merchant_name: 'Acme Corporation',
    api_key: 'pk_live_51H...',
    merchant_secret: 'sk_live_51H...',
    environment: 'production',
    is_default: true,
  },
  {
    id: '2',
    merchant_id: 'MERCH-001',
    merchant_name: 'Acme Corporation',
    api_key: 'pk_test_51H...',
    merchant_secret: 'sk_test_51H...',
    environment: 'sandbox',
    is_default: false,
  },
  {
    id: '3',
    merchant_id: 'MERCH-002',
    merchant_name: 'Tech Solutions Ltd',
    api_key: 'pk_live_52H...',
    merchant_secret: 'sk_live_52H...',
    environment: 'production',
    is_default: true,
  },
  {
    id: '4',
    merchant_id: 'MERCH-005',
    merchant_name: 'Retail Partners Group',
    api_key: 'pk_live_53H...',
    merchant_secret: 'sk_live_53H...',
    environment: 'production',
    is_default: true,
  },
];

const generateFakePaymentGateways = (): PaymentGateway[] => [
  { id: '1', payment_gateway_name: 'Stripe', provider: 'Stripe Inc', supports_webhook: true },
  { id: '2', payment_gateway_name: 'PayPal', provider: 'PayPal Holdings', supports_webhook: true },
  { id: '3', payment_gateway_name: 'Square', provider: 'Square Inc', supports_webhook: true },
  { id: '4', payment_gateway_name: 'Razorpay', provider: 'Razorpay Software', supports_webhook: true },
  { id: '5', payment_gateway_name: 'Authorize.Net', provider: 'Visa', supports_webhook: false },
];

const getStatusBadgeColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800';
    case 'inactive':
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
    case 'pending':
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
    default:
      return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
  }
};

const getEnvironmentBadgeColor = (env: string) => {
  switch (env.toLowerCase()) {
    case 'production':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    case 'sandbox':
      return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800';
    default:
      return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
  }
};

export default function MerchantsPage() {
  // Merchants state
  const [merchants, setMerchants] = useState<Merchant[]>(generateFakeMerchants());
  const [merchantSearch, setMerchantSearch] = useState('');
  const [merchantStatusFilter, setMerchantStatusFilter] = useState('all');
  const [isMerchantModalOpen, setIsMerchantModalOpen] = useState(false);
  const [isMerchantDeleteOpen, setIsMerchantDeleteOpen] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [merchantMode, setMerchantMode] = useState<'create' | 'edit'>('create');
  const [merchantForm, setMerchantForm] = useState({
    name: '',
    merchant_id: '',
    currency: 'USD',
    status: 'active' as 'active' | 'inactive' | 'pending',
  });

  // Payment Gateway Accounts state
  const [gatewayAccounts, setGatewayAccounts] = useState<PaymentGatewayAccount[]>(
    generateFakePaymentGatewayAccounts(merchants)
  );
  const [accountSearch, setAccountSearch] = useState('');
  const [accountEnvFilter, setAccountEnvFilter] = useState('all');
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isAccountDeleteOpen, setIsAccountDeleteOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<PaymentGatewayAccount | null>(null);
  const [accountMode, setAccountMode] = useState<'create' | 'edit'>('create');
  const [accountForm, setAccountForm] = useState({
    merchant_id: '',
    api_key: '',
    merchant_secret: '',
    environment: 'sandbox' as 'sandbox' | 'production',
    is_default: false,
  });

  // Payment Gateways state
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>(
    generateFakePaymentGateways()
  );
  const [gatewaySearch, setGatewaySearch] = useState('');
  const [isGatewayModalOpen, setIsGatewayModalOpen] = useState(false);
  const [isGatewayDeleteOpen, setIsGatewayDeleteOpen] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);
  const [gatewayMode, setGatewayMode] = useState<'create' | 'edit'>('create');
  const [gatewayForm, setGatewayForm] = useState({
    payment_gateway_name: '',
    provider: '',
    supports_webhook: false,
  });

  // Merchant handlers
  const handleAddMerchant = () => {
    setMerchantMode('create');
    setSelectedMerchant(null);
    setMerchantForm({
      name: '',
      merchant_id: '',
      currency: 'USD',
      status: 'active',
    });
    setIsMerchantModalOpen(true);
  };

  const handleEditMerchant = (merchant: Merchant) => {
    setMerchantMode('edit');
    setSelectedMerchant(merchant);
    setMerchantForm({
      name: merchant.name,
      merchant_id: merchant.merchant_id,
      currency: merchant.currency,
      status: merchant.status,
    });
    setIsMerchantModalOpen(true);
  };

  const handleDeleteMerchant = (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    setIsMerchantDeleteOpen(true);
  };

  const handleMerchantSubmit = () => {
    if (!merchantForm.name || !merchantForm.merchant_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (merchantMode === 'create') {
      const newMerchant: Merchant = {
        id: String(merchants.length + 1),
        ...merchantForm,
      };
      setMerchants([...merchants, newMerchant]);
      toast.success('Merchant created successfully');
    } else if (selectedMerchant) {
      setMerchants(
        merchants.map((m) =>
          m.id === selectedMerchant.id ? { ...m, ...merchantForm } : m
        )
      );
      toast.success('Merchant updated successfully');
    }
    setIsMerchantModalOpen(false);
  };

  const handleMerchantDeleteConfirm = () => {
    if (selectedMerchant) {
      setMerchants(merchants.filter((m) => m.id !== selectedMerchant.id));
      setGatewayAccounts(
        gatewayAccounts.filter((acc) => acc.merchant_id !== selectedMerchant.merchant_id)
      );
      toast.success('Merchant deleted successfully');
      setIsMerchantDeleteOpen(false);
    }
  };

  // Payment Gateway Account handlers
  const handleAddAccount = () => {
    setAccountMode('create');
    setSelectedAccount(null);
    setAccountForm({
      merchant_id: '',
      api_key: '',
      merchant_secret: '',
      environment: 'sandbox',
      is_default: false,
    });
    setIsAccountModalOpen(true);
  };

  const handleEditAccount = (account: PaymentGatewayAccount) => {
    setAccountMode('edit');
    setSelectedAccount(account);
    setAccountForm({
      merchant_id: account.merchant_id,
      api_key: account.api_key,
      merchant_secret: account.merchant_secret,
      environment: account.environment,
      is_default: account.is_default,
    });
    setIsAccountModalOpen(true);
  };

  const handleDeleteAccount = (account: PaymentGatewayAccount) => {
    setSelectedAccount(account);
    setIsAccountDeleteOpen(true);
  };

  const handleAccountSubmit = () => {
    if (!accountForm.merchant_id || !accountForm.api_key || !accountForm.merchant_secret) {
      toast.error('Please fill in all required fields');
      return;
    }

    const merchant = merchants.find((m) => m.merchant_id === accountForm.merchant_id);
    if (!merchant) {
      toast.error('Merchant not found');
      return;
    }

    if (accountMode === 'create') {
      const newAccount: PaymentGatewayAccount = {
        id: String(gatewayAccounts.length + 1),
        merchant_id: accountForm.merchant_id,
        merchant_name: merchant.name,
        api_key: accountForm.api_key,
        merchant_secret: accountForm.merchant_secret,
        environment: accountForm.environment,
        is_default: accountForm.is_default,
      };
      setGatewayAccounts([...gatewayAccounts, newAccount]);
      toast.success('Payment Gateway Account created successfully');
    } else if (selectedAccount) {
      setGatewayAccounts(
        gatewayAccounts.map((acc) =>
          acc.id === selectedAccount.id
            ? {
                ...acc,
                ...accountForm,
                merchant_name: merchant.name,
              }
            : acc
        )
      );
      toast.success('Payment Gateway Account updated successfully');
    }
    setIsAccountModalOpen(false);
  };

  const handleAccountDeleteConfirm = () => {
    if (selectedAccount) {
      setGatewayAccounts(gatewayAccounts.filter((acc) => acc.id !== selectedAccount.id));
      toast.success('Payment Gateway Account deleted successfully');
      setIsAccountDeleteOpen(false);
    }
  };

  // Payment Gateway handlers
  const handleAddGateway = () => {
    setGatewayMode('create');
    setSelectedGateway(null);
    setGatewayForm({
      payment_gateway_name: '',
      provider: '',
      supports_webhook: false,
    });
    setIsGatewayModalOpen(true);
  };

  const handleEditGateway = (gateway: PaymentGateway) => {
    setGatewayMode('edit');
    setSelectedGateway(gateway);
    setGatewayForm({
      payment_gateway_name: gateway.payment_gateway_name,
      provider: gateway.provider,
      supports_webhook: gateway.supports_webhook,
    });
    setIsGatewayModalOpen(true);
  };

  const handleDeleteGateway = (gateway: PaymentGateway) => {
    setSelectedGateway(gateway);
    setIsGatewayDeleteOpen(true);
  };

  const handleGatewaySubmit = () => {
    if (!gatewayForm.payment_gateway_name || !gatewayForm.provider) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (gatewayMode === 'create') {
      const newGateway: PaymentGateway = {
        id: String(paymentGateways.length + 1),
        ...gatewayForm,
      };
      setPaymentGateways([...paymentGateways, newGateway]);
      toast.success('Payment Gateway created successfully');
    } else if (selectedGateway) {
      setPaymentGateways(
        paymentGateways.map((g) =>
          g.id === selectedGateway.id ? { ...g, ...gatewayForm } : g
        )
      );
      toast.success('Payment Gateway updated successfully');
    }
    setIsGatewayModalOpen(false);
  };

  const handleGatewayDeleteConfirm = () => {
    if (selectedGateway) {
      setPaymentGateways(paymentGateways.filter((g) => g.id !== selectedGateway.id));
      toast.success('Payment Gateway deleted successfully');
      setIsGatewayDeleteOpen(false);
    }
  };

  // Filter functions
  const filteredMerchants = merchants.filter((merchant) => {
    const matchesSearch =
      merchant.name.toLowerCase().includes(merchantSearch.toLowerCase()) ||
      merchant.merchant_id.toLowerCase().includes(merchantSearch.toLowerCase());
    const matchesStatus = merchantStatusFilter === 'all' || merchant.status === merchantStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredAccounts = gatewayAccounts.filter((account) => {
    const matchesSearch =
      account.merchant_id.toLowerCase().includes(accountSearch.toLowerCase()) ||
      account.merchant_name?.toLowerCase().includes(accountSearch.toLowerCase());
    const matchesEnv = accountEnvFilter === 'all' || account.environment === accountEnvFilter;
    return matchesSearch && matchesEnv;
  });

  const filteredGateways = paymentGateways.filter((gateway) => {
    return (
      gateway.payment_gateway_name.toLowerCase().includes(gatewaySearch.toLowerCase()) ||
      gateway.provider.toLowerCase().includes(gatewaySearch.toLowerCase())
    );
  });

  // Column definitions
  const merchantColumns = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'merchant_id',
      header: 'Merchant ID',
      cell: ({ row }: { row: { original: Merchant } }) => (
        <span className="font-mono text-sm">{row.original.merchant_id}</span>
      ),
    },
    {
      accessorKey: 'currency',
      header: 'Currency',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: Merchant } }) => (
        <Badge className={cn('text-xs', getStatusBadgeColor(row.original.status))}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: { original: Merchant } }) => (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer"
            onClick={() => handleEditMerchant(row.original)}
            title="Edit merchant">
            <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/30 cursor-pointer"
            onClick={() => handleDeleteMerchant(row.original)}
            title="Delete merchant">
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
          </Button>
        </div>
      ),
    },
  ];

  const accountColumns = [
    {
      accessorKey: 'merchant_name',
      header: 'Merchant',
    },
    {
      accessorKey: 'merchant_id',
      header: 'Merchant ID',
      cell: ({ row }: { row: { original: PaymentGatewayAccount } }) => (
        <span className="font-mono text-sm">{row.original.merchant_id}</span>
      ),
    },
    {
      accessorKey: 'api_key',
      header: 'API Key',
      cell: ({ row }: { row: { original: PaymentGatewayAccount } }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.api_key.substring(0, 15)}...
        </span>
      ),
    },
    {
      accessorKey: 'environment',
      header: 'Environment',
      cell: ({ row }: { row: { original: PaymentGatewayAccount } }) => (
        <Badge className={cn('text-xs', getEnvironmentBadgeColor(row.original.environment))}>
          {row.original.environment}
        </Badge>
      ),
    },
    {
      accessorKey: 'is_default',
      header: 'Default',
      cell: ({ row }: { row: { original: PaymentGatewayAccount } }) => (
        <Badge
          variant={row.original.is_default ? 'default' : 'outline'}
          className="text-xs">
          {row.original.is_default ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: { original: PaymentGatewayAccount } }) => (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer"
            onClick={() => handleEditAccount(row.original)}
            title="Edit account">
            <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/30 cursor-pointer"
            onClick={() => handleDeleteAccount(row.original)}
            title="Delete account">
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
          </Button>
        </div>
      ),
    },
  ];

  const gatewayColumns = [
    {
      accessorKey: 'payment_gateway_name',
      header: 'Gateway Name',
    },
    {
      accessorKey: 'provider',
      header: 'Provider',
    },
    {
      accessorKey: 'supports_webhook',
      header: 'Webhook Support',
      cell: ({ row }: { row: { original: PaymentGateway } }) => (
        <Badge variant={row.original.supports_webhook ? 'default' : 'outline'} className="text-xs">
          {row.original.supports_webhook ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: { original: PaymentGateway } }) => (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer"
            onClick={() => handleEditGateway(row.original)}
            title="Edit gateway">
            <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/30 cursor-pointer"
            onClick={() => handleDeleteGateway(row.original)}
            title="Delete gateway">
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header title="Merchant Management" />
        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="mx-auto w-full max-w-6xl space-y-4">
            <Tabs defaultValue="merchants" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="merchants">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Merchants
                </TabsTrigger>
                <TabsTrigger value="accounts">
                  <Key className="w-4 h-4 mr-2" />
                  Gateway Accounts
                </TabsTrigger>
                <TabsTrigger value="gateways">
                  <Globe className="w-4 h-4 mr-2" />
                  Payment Gateways
                </TabsTrigger>
              </TabsList>

              {/* Merchants Tab */}
              <TabsContent value="merchants" className="space-y-4">
                <Card className="border-0 overflow-hidden">
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                        <div className="flex flex-col sm:flex-row gap-3 flex-1">
                          <Select
                            value={merchantStatusFilter}
                            onValueChange={setMerchantStatusFilter}>
                            <SelectTrigger className="w-auto">
                              <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Status</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                          </Select>

                          <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search merchants..."
                              value={merchantSearch}
                              onChange={(e) => setMerchantSearch(e.target.value)}
                              className="pl-8"
                            />
                          </div>
                        </div>

                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm w-auto"
                          onClick={handleAddMerchant}>
                          <Plus className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">Add Merchant</span>
                          <span className="sm:hidden">Add</span>
                        </Button>
                      </div>

                      <DataTable data={filteredMerchants} columns={merchantColumns} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Payment Gateway Accounts Tab */}
              <TabsContent value="accounts" className="space-y-4">
                <Card className="border-0 overflow-hidden">
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                        <div className="flex flex-col sm:flex-row gap-3 flex-1">
                          <Select
                            value={accountEnvFilter}
                            onValueChange={setAccountEnvFilter}>
                            <SelectTrigger className="w-auto">
                              <SelectValue placeholder="Filter by environment" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Environments</SelectItem>
                              <SelectItem value="production">Production</SelectItem>
                              <SelectItem value="sandbox">Sandbox</SelectItem>
                            </SelectContent>
                          </Select>

                          <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search accounts..."
                              value={accountSearch}
                              onChange={(e) => setAccountSearch(e.target.value)}
                              className="pl-8"
                            />
                          </div>
                        </div>

                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm w-auto"
                          onClick={handleAddAccount}>
                          <Plus className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">Add Account</span>
                          <span className="sm:hidden">Add</span>
                        </Button>
                      </div>

                      <DataTable data={filteredAccounts} columns={accountColumns} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Payment Gateways Tab */}
              <TabsContent value="gateways" className="space-y-4">
                <Card className="border-0 overflow-hidden">
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                        <div className="relative flex-1 max-w-sm">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search gateways..."
                            value={gatewaySearch}
                            onChange={(e) => setGatewaySearch(e.target.value)}
                            className="pl-8"
                          />
                        </div>

                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm w-auto"
                          onClick={handleAddGateway}>
                          <Plus className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">Add Gateway</span>
                          <span className="sm:hidden">Add</span>
                        </Button>
                      </div>

                      <DataTable data={filteredGateways} columns={gatewayColumns} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Merchant Modal */}
        <Dialog open={isMerchantModalOpen} onOpenChange={setIsMerchantModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {merchantMode === 'create' ? 'Create Merchant' : 'Edit Merchant'}
              </DialogTitle>
              <DialogDescription>
                {merchantMode === 'create'
                  ? 'Add a new merchant to the system'
                  : 'Update merchant information'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="merchant-name">Name *</Label>
                <Input
                  id="merchant-name"
                  value={merchantForm.name}
                  onChange={(e) =>
                    setMerchantForm({ ...merchantForm, name: e.target.value })
                  }
                  placeholder="Enter merchant name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="merchant-id">Merchant ID *</Label>
                <Input
                  id="merchant-id"
                  value={merchantForm.merchant_id}
                  onChange={(e) =>
                    setMerchantForm({ ...merchantForm, merchant_id: e.target.value })
                  }
                  placeholder="Enter merchant ID"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="merchant-currency">Currency *</Label>
                <Select
                  value={merchantForm.currency}
                  onValueChange={(value) =>
                    setMerchantForm({ ...merchantForm, currency: value })
                  }>
                  <SelectTrigger id="merchant-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                    <SelectItem value="AUD">AUD</SelectItem>
                    <SelectItem value="JPY">JPY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="merchant-status">Status *</Label>
                <Select
                  value={merchantForm.status}
                  onValueChange={(value: 'active' | 'inactive' | 'pending') =>
                    setMerchantForm({ ...merchantForm, status: value })
                  }>
                  <SelectTrigger id="merchant-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsMerchantModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleMerchantSubmit}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Merchant Delete Confirmation */}
        <AlertDialog open={isMerchantDeleteOpen} onOpenChange={setIsMerchantDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Merchant</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedMerchant?.name}"? This action cannot be
                undone and will also delete associated payment gateway accounts.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleMerchantDeleteConfirm}
                className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Payment Gateway Account Modal */}
        <Dialog open={isAccountModalOpen} onOpenChange={setIsAccountModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {accountMode === 'create' ? 'Create Payment Gateway Account' : 'Edit Account'}
              </DialogTitle>
              <DialogDescription>
                {accountMode === 'create'
                  ? 'Add a new payment gateway account'
                  : 'Update payment gateway account information'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="account-merchant">Merchant *</Label>
                <Select
                  value={accountForm.merchant_id}
                  onValueChange={(value) =>
                    setAccountForm({ ...accountForm, merchant_id: value })
                  }>
                  <SelectTrigger id="account-merchant">
                    <SelectValue placeholder="Select merchant" />
                  </SelectTrigger>
                  <SelectContent>
                    {merchants.map((merchant) => (
                      <SelectItem key={merchant.id} value={merchant.merchant_id}>
                        {merchant.name} ({merchant.merchant_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-api-key">API Key *</Label>
                <Input
                  id="account-api-key"
                  value={accountForm.api_key}
                  onChange={(e) =>
                    setAccountForm({ ...accountForm, api_key: e.target.value })
                  }
                  placeholder="Enter API key"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-secret">Merchant Secret *</Label>
                <Input
                  id="account-secret"
                  type="password"
                  value={accountForm.merchant_secret}
                  onChange={(e) =>
                    setAccountForm({ ...accountForm, merchant_secret: e.target.value })
                  }
                  placeholder="Enter merchant secret"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-environment">Environment *</Label>
                <Select
                  value={accountForm.environment}
                  onValueChange={(value: 'sandbox' | 'production') =>
                    setAccountForm({ ...accountForm, environment: value })
                  }>
                  <SelectTrigger id="account-environment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">Sandbox</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="account-default"
                  checked={accountForm.is_default}
                  onChange={(e) =>
                    setAccountForm({ ...accountForm, is_default: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="account-default" className="cursor-pointer">
                  Set as default account
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAccountModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAccountSubmit}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Account Delete Confirmation */}
        <AlertDialog open={isAccountDeleteOpen} onOpenChange={setIsAccountDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Payment Gateway Account</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this payment gateway account? This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleAccountDeleteConfirm}
                className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Payment Gateway Modal */}
        <Dialog open={isGatewayModalOpen} onOpenChange={setIsGatewayModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {gatewayMode === 'create' ? 'Create Payment Gateway' : 'Edit Payment Gateway'}
              </DialogTitle>
              <DialogDescription>
                {gatewayMode === 'create'
                  ? 'Add a new payment gateway'
                  : 'Update payment gateway information'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gateway-name">Gateway Name *</Label>
                <Input
                  id="gateway-name"
                  value={gatewayForm.payment_gateway_name}
                  onChange={(e) =>
                    setGatewayForm({
                      ...gatewayForm,
                      payment_gateway_name: e.target.value,
                    })
                  }
                  placeholder="Enter gateway name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gateway-provider">Provider *</Label>
                <Input
                  id="gateway-provider"
                  value={gatewayForm.provider}
                  onChange={(e) =>
                    setGatewayForm({ ...gatewayForm, provider: e.target.value })
                  }
                  placeholder="Enter provider name"
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="gateway-webhook"
                  checked={gatewayForm.supports_webhook}
                  onChange={(e) =>
                    setGatewayForm({ ...gatewayForm, supports_webhook: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="gateway-webhook" className="cursor-pointer">
                  Supports Webhook
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsGatewayModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleGatewaySubmit}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Gateway Delete Confirmation */}
        <AlertDialog open={isGatewayDeleteOpen} onOpenChange={setIsGatewayDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Payment Gateway</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedGateway?.payment_gateway_name}"? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleGatewayDeleteConfirm}
                className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
