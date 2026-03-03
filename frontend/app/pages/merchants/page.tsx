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
  FileText,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
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
} from '@/components/ui/alert-dialog';
import {
  listMerchants,
  listMerchantGatewayAccounts,
  listPaymentTransactionLogs,
  createMerchant,
  updateMerchant,
  deleteMerchant,
  createMerchantGatewayAccount,
  updateMerchantGatewayAccount,
  deleteMerchantGatewayAccount,
  type Merchant,
  type MerchantGatewayAccount,
  type PaymentTransactionLog,
} from '@/lib/api';
import { getERPNextToken } from '@/lib/api/utils/token';

const getActiveBadgeColor = (isActive: number | boolean | undefined) => {
  const active = isActive === 1 || isActive === true;
  return active
    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800'
    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
};

const getEnvironmentBadgeColor = (env: string) => {
  switch (env?.toLowerCase()) {
    case 'production':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    case 'sandbox':
      return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800';
    default:
      return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
  }
};

const getStatusBadgeColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800';
    case 'failed':
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
    case 'processing':
    case 'initiated':
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
    default:
      return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
  }
};

type OrganizationOption = { name: string; organization_name?: string };

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [gatewayAccounts, setGatewayAccounts] = useState<MerchantGatewayAccount[]>([]);
  const [transactionLogs, setTransactionLogs] = useState<PaymentTransactionLog[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [merchantSearch, setMerchantSearch] = useState('');
  const [merchantActiveFilter, setMerchantActiveFilter] = useState<'all' | '1' | '0'>('all');
  const [accountSearch, setAccountSearch] = useState('');
  const [accountEnvFilter, setAccountEnvFilter] = useState('all');
  const [logSearch, setLogSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);

  const [isMerchantModalOpen, setIsMerchantModalOpen] = useState(false);
  const [isMerchantDeleteOpen, setIsMerchantDeleteOpen] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [merchantMode, setMerchantMode] = useState<'create' | 'edit'>('create');
  const [merchantSubmitting, setMerchantSubmitting] = useState(false);
  const [merchantForm, setMerchantForm] = useState({
    merchant_code: '',
    merchant_name: '',
    select: '',
    is_active: true,
    default_currency: 'USD',
    contact_email: '',
    contact_person: '',
    contact_phone: '',
    webhook_url: '',
    api_version: '',
    additional_information: '',
  });

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isAccountDeleteOpen, setIsAccountDeleteOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<MerchantGatewayAccount | null>(null);
  const [accountMode, setAccountMode] = useState<'create' | 'edit'>('create');
  const [accountSubmitting, setAccountSubmitting] = useState(false);
  const [accountForm, setAccountForm] = useState({
    merchant: '',
    account_name: '',
    merchant_id: '',
    api_key: '',
    merchant_secret: '',
    environment: 'Sandbox' as 'Sandbox' | 'Production',
    is_default: false,
    currency: 'USD',
    is_active: true,
    payment_gateway: '',
    webhook_secret: '',
  });

  const loadMerchants = useCallback(async () => {
    try {
      const { data } = await listMerchants();
      setMerchants(data || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load merchants');
      setMerchants([]);
    }
  }, []);

  const loadGatewayAccounts = useCallback(async () => {
    try {
      const { data } = await listMerchantGatewayAccounts();
      setGatewayAccounts(data || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load gateway accounts');
      setGatewayAccounts([]);
    }
  }, []);

  const loadTransactionLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const { data } = await listPaymentTransactionLogs({ limit: 50 });
      setTransactionLogs(data || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load transaction logs');
      setTransactionLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  const loadOrganizations = useCallback(async () => {
    const token = await getERPNextToken();
    if (!token) return;
    try {
      const res = await fetch('/api/erpnext/organization', {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        setOrganizations(json.data || []);
      }
    } catch {
      setOrganizations([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await Promise.all([loadMerchants(), loadGatewayAccounts(), loadOrganizations()]);
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [loadMerchants, loadGatewayAccounts, loadOrganizations]);

  const handleAddMerchant = () => {
    setMerchantMode('create');
    setSelectedMerchant(null);
    setMerchantForm({
      merchant_code: '',
      merchant_name: '',
      select: '',
      is_active: true,
      default_currency: 'USD',
      contact_email: '',
      contact_person: '',
      contact_phone: '',
      webhook_url: '',
      api_version: '',
      additional_information: '',
    });
    setIsMerchantModalOpen(true);
  };

  const handleEditMerchant = (merchant: Merchant) => {
    setMerchantMode('edit');
    setSelectedMerchant(merchant);
    setMerchantForm({
      merchant_code: merchant.merchant_code ?? '',
      merchant_name: merchant.merchant_name ?? '',
      select: merchant.select ?? '',
      is_active: merchant.is_active === 1 || merchant.is_active === true,
      default_currency: merchant.default_currency ?? 'USD',
      contact_email: merchant.contact_email ?? '',
      contact_person: merchant.contact_person ?? '',
      contact_phone: merchant.contact_phone ?? '',
      webhook_url: merchant.webhook_url ?? '',
      api_version: merchant.api_version ?? '',
      additional_information: merchant.additional_information ?? '',
    });
    setIsMerchantModalOpen(true);
  };

  const handleDeleteMerchant = (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    setIsMerchantDeleteOpen(true);
  };

  const handleMerchantSubmit = async () => {
    if (!merchantForm.merchant_code || !merchantForm.merchant_name) {
      toast.error('Merchant Code and Merchant Name are required');
      return;
    }
    setMerchantSubmitting(true);
    try {
      const payload = {
        merchant_code: merchantForm.merchant_code,
        merchant_name: merchantForm.merchant_name,
        select: merchantForm.select || undefined,
        is_active: merchantForm.is_active ? 1 : 0,
        default_currency: merchantForm.default_currency || undefined,
        contact_email: merchantForm.contact_email || undefined,
        contact_person: merchantForm.contact_person || undefined,
        contact_phone: merchantForm.contact_phone || undefined,
        webhook_url: merchantForm.webhook_url || undefined,
        api_version: merchantForm.api_version || undefined,
        additional_information: merchantForm.additional_information || undefined,
      };
      if (merchantMode === 'create') {
        await createMerchant(payload);
        toast.success('Merchant created successfully');
        await loadMerchants();
      } else if (selectedMerchant) {
        await updateMerchant(selectedMerchant.name, payload);
        toast.success('Merchant updated successfully');
        await loadMerchants();
        await loadGatewayAccounts();
      }
      setIsMerchantModalOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save merchant');
    } finally {
      setMerchantSubmitting(false);
    }
  };

  const handleMerchantDeleteConfirm = async () => {
    if (!selectedMerchant) return;
    try {
      await deleteMerchant(selectedMerchant.name);
      toast.success('Merchant deleted successfully');
      await loadMerchants();
      await loadGatewayAccounts();
      setIsMerchantDeleteOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete merchant');
    }
  };

  const handleAddAccount = () => {
    setAccountMode('create');
    setSelectedAccount(null);
    setAccountForm({
      merchant: '',
      account_name: '',
      merchant_id: '',
      api_key: '',
      merchant_secret: '',
      environment: 'Sandbox',
      is_default: false,
      currency: 'USD',
      is_active: true,
      payment_gateway: '',
      webhook_secret: '',
    });
    setIsAccountModalOpen(true);
  };

  const handleEditAccount = (account: MerchantGatewayAccount) => {
    setAccountMode('edit');
    setSelectedAccount(account);
    setAccountForm({
      merchant: account.merchant ?? '',
      account_name: account.account_name ?? '',
      merchant_id: account.merchant_id ?? '',
      api_key: account.api_key ?? '',
      merchant_secret: account.merchant_secret ?? '',
      environment: (account.environment as 'Sandbox' | 'Production') || 'Sandbox',
      is_default: account.is_default === 1 || account.is_default === true,
      currency: account.currency ?? 'USD',
      is_active: account.is_active === 1 || account.is_active === true,
      payment_gateway: account.payment_gateway ?? '',
      webhook_secret: account.webhook_secret ?? '',
    });
    setIsAccountModalOpen(true);
  };

  const handleDeleteAccount = (account: MerchantGatewayAccount) => {
    setSelectedAccount(account);
    setIsAccountDeleteOpen(true);
  };

  const handleAccountSubmit = async () => {
    if (!accountForm.merchant) {
      toast.error('Merchant is required');
      return;
    }
    setAccountSubmitting(true);
    try {
      const payload = {
        merchant: accountForm.merchant,
        account_name: accountForm.account_name || undefined,
        merchant_id: accountForm.merchant_id || undefined,
        api_key: accountForm.api_key || undefined,
        merchant_secret: accountForm.merchant_secret || undefined,
        environment: accountForm.environment,
        is_default: accountForm.is_default ? 1 : 0,
        currency: accountForm.currency || undefined,
        is_active: accountForm.is_active ? 1 : 0,
        payment_gateway: accountForm.payment_gateway || undefined,
        webhook_secret: accountForm.webhook_secret || undefined,
      };
      if (accountMode === 'create') {
        await createMerchantGatewayAccount(payload);
        toast.success('Gateway account created successfully');
        await loadGatewayAccounts();
      } else if (selectedAccount) {
        await updateMerchantGatewayAccount(selectedAccount.name, payload);
        toast.success('Gateway account updated successfully');
        await loadGatewayAccounts();
      }
      setIsAccountModalOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save gateway account');
    } finally {
      setAccountSubmitting(false);
    }
  };

  const handleAccountDeleteConfirm = async () => {
    if (!selectedAccount) return;
    try {
      await deleteMerchantGatewayAccount(selectedAccount.name);
      toast.success('Gateway account deleted successfully');
      await loadGatewayAccounts();
      setIsAccountDeleteOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete gateway account');
    }
  };

  const filteredMerchants = merchants.filter((m) => {
    const matchesSearch =
      (m.merchant_name ?? '').toLowerCase().includes(merchantSearch.toLowerCase()) ||
      (m.merchant_code ?? m.name ?? '').toLowerCase().includes(merchantSearch.toLowerCase());
    const matchesActive =
      merchantActiveFilter === 'all' ||
      (merchantActiveFilter === '1' && (m.is_active === 1 || m.is_active === true)) ||
      (merchantActiveFilter === '0' && (m.is_active === 0 || m.is_active === false));
    return matchesSearch && matchesActive;
  });

  const filteredAccounts = gatewayAccounts.filter((acc) => {
    const merchantName = merchants.find((m) => m.name === acc.merchant)?.merchant_name ?? acc.merchant ?? '';
    const matchesSearch =
      (acc.account_name ?? '').toLowerCase().includes(accountSearch.toLowerCase()) ||
      (acc.merchant ?? '').toLowerCase().includes(accountSearch.toLowerCase()) ||
      merchantName.toLowerCase().includes(accountSearch.toLowerCase());
    const matchesEnv = accountEnvFilter === 'all' || acc.environment === accountEnvFilter;
    return matchesSearch && matchesEnv;
  });

  const filteredLogs = transactionLogs.filter((log) => {
    if (!logSearch.trim()) return true;
    const q = logSearch.toLowerCase();
    return (
      (log.payment_request ?? '').toLowerCase().includes(q) ||
      (log.gateway_event ?? '').toLowerCase().includes(q) ||
      (log.gateway_reference ?? '').toLowerCase().includes(q) ||
      (log.event_type ?? '').toLowerCase().includes(q)
    );
  });

  const merchantColumns = [
    { accessorKey: 'merchant_name', header: 'Merchant Name' },
    {
      accessorKey: 'merchant_code',
      header: 'Merchant Code',
      cell: ({ row }: { row: { original: Merchant } }) => (
        <span className="font-mono text-sm">{row.original.merchant_code ?? row.original.name}</span>
      ),
    },
    { accessorKey: 'select', header: 'Organization' },
    { accessorKey: 'default_currency', header: 'Currency' },
    {
      accessorKey: 'is_active',
      header: 'Active',
      cell: ({ row }: { row: { original: Merchant } }) => (
        <Badge className={cn('text-xs', getActiveBadgeColor(row.original.is_active))}>
          {row.original.is_active === 1 || row.original.is_active === true ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: { original: Merchant } }) => (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer" onClick={() => handleEditMerchant(row.original)} title="Edit merchant">
            <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/30 cursor-pointer" onClick={() => handleDeleteMerchant(row.original)} title="Delete merchant">
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
          </Button>
        </div>
      ),
    },
  ];

  const accountColumns = [
    {
      accessorKey: 'merchant',
      header: 'Merchant',
      cell: ({ row }: { row: { original: MerchantGatewayAccount } }) => {
        const m = merchants.find((x) => x.name === row.original.merchant);
        return m?.merchant_name ?? row.original.merchant ?? '—';
      },
    },
    { accessorKey: 'account_name', header: 'Account Name' },
    {
      accessorKey: 'api_key',
      header: 'API Key',
      cell: ({ row }: { row: { original: MerchantGatewayAccount } }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.api_key ? `${String(row.original.api_key).slice(0, 12)}...` : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'environment',
      header: 'Environment',
      cell: ({ row }: { row: { original: MerchantGatewayAccount } }) => (
        <Badge className={cn('text-xs', getEnvironmentBadgeColor(row.original.environment ?? ''))}>
          {row.original.environment ?? '—'}
        </Badge>
      ),
    },
    {
      accessorKey: 'is_default',
      header: 'Default',
      cell: ({ row }: { row: { original: MerchantGatewayAccount } }) => (
        <Badge variant={row.original.is_default ? 'default' : 'outline'} className="text-xs">
          {row.original.is_default === 1 || row.original.is_default === true ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: { original: MerchantGatewayAccount } }) => (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer" onClick={() => handleEditAccount(row.original)} title="Edit account">
            <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/30 cursor-pointer" onClick={() => handleDeleteAccount(row.original)} title="Delete account">
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
          </Button>
        </div>
      ),
    },
  ];

  const transactionLogColumns = [
    { accessorKey: 'payment_request', header: 'Payment Request' },
    { accessorKey: 'event_type', header: 'Event Type' },
    { accessorKey: 'gateway_event', header: 'Gateway Event' },
    { accessorKey: 'gateway_reference', header: 'Gateway Ref' },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }: { row: { original: PaymentTransactionLog } }) =>
        row.original.currency && row.original.amount != null
          ? `${row.original.currency} ${Number(row.original.amount).toFixed(2)}`
          : '—',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: PaymentTransactionLog } }) => (
        <Badge className={cn('text-xs', getStatusBadgeColor(row.original.status ?? ''))}>
          {row.original.status ?? '—'}
        </Badge>
      ),
    },
    {
      accessorKey: 'is_processed',
      header: 'Processed',
      cell: ({ row }: { row: { original: PaymentTransactionLog } }) =>
        row.original.is_processed === 1 || row.original.is_processed === true ? 'Yes' : 'No',
    },
    { accessorKey: 'timestamp', header: 'Time' },
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
                <TabsTrigger value="logs">
                  <FileText className="w-4 h-4 mr-2" />
                  Transaction Log
                </TabsTrigger>
              </TabsList>

              <TabsContent value="merchants" className="space-y-4">
                <Card className="border-0 overflow-hidden">
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                        <div className="flex flex-col sm:flex-row gap-3 flex-1">
                          <Select value={merchantActiveFilter} onValueChange={(v: 'all' | '1' | '0') => setMerchantActiveFilter(v)}>
                            <SelectTrigger className="w-auto">
                              <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="1">Active</SelectItem>
                              <SelectItem value="0">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search merchants..." value={merchantSearch} onChange={(e) => setMerchantSearch(e.target.value)} className="pl-8" />
                          </div>
                        </div>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm w-auto" onClick={handleAddMerchant} disabled={loading}>
                          <Plus className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">Add Merchant</span>
                          <span className="sm:hidden">Add</span>
                        </Button>
                      </div>
                      {loading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <DataTable data={filteredMerchants} columns={merchantColumns} />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="accounts" className="space-y-4">
                <Card className="border-0 overflow-hidden">
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                        <div className="flex flex-col sm:flex-row gap-3 flex-1">
                          <Select value={accountEnvFilter} onValueChange={setAccountEnvFilter}>
                            <SelectTrigger className="w-auto">
                              <SelectValue placeholder="Filter by environment" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Environments</SelectItem>
                              <SelectItem value="Production">Production</SelectItem>
                              <SelectItem value="Sandbox">Sandbox</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search accounts..." value={accountSearch} onChange={(e) => setAccountSearch(e.target.value)} className="pl-8" />
                          </div>
                        </div>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm w-auto" onClick={handleAddAccount} disabled={loading}>
                          <Plus className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">Add Account</span>
                          <span className="sm:hidden">Add</span>
                        </Button>
                      </div>
                      {loading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <DataTable data={filteredAccounts} columns={accountColumns} />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="logs" className="space-y-4" onFocusCapture={loadTransactionLogs}>
                <Card className="border-0 overflow-hidden">
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                        <div className="relative flex-1 max-w-sm">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="Search logs..." value={logSearch} onChange={(e) => setLogSearch(e.target.value)} className="pl-8" />
                        </div>
                        <Button size="sm" variant="outline" onClick={loadTransactionLogs} disabled={logsLoading}>
                          {logsLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Refresh
                        </Button>
                      </div>
                      {logsLoading && transactionLogs.length === 0 ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <DataTable data={filteredLogs} columns={transactionLogColumns} />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Merchant Modal */}
        <Dialog open={isMerchantModalOpen} onOpenChange={setIsMerchantModalOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{merchantMode === 'create' ? 'Create Merchant' : 'Edit Merchant'}</DialogTitle>
              <DialogDescription>
                {merchantMode === 'create' ? 'Add a new merchant (ERPNext DocType).' : 'Update merchant information.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="merchant-code">Merchant Code *</Label>
                <Input
                  id="merchant-code"
                  value={merchantForm.merchant_code}
                  onChange={(e) => setMerchantForm({ ...merchantForm, merchant_code: e.target.value })}
                  placeholder="Unique code (e.g. MERCH-001)"
                  required
                  disabled={merchantMode === 'edit'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="merchant-name">Merchant Name *</Label>
                <Input
                  id="merchant-name"
                  value={merchantForm.merchant_name}
                  onChange={(e) => setMerchantForm({ ...merchantForm, merchant_name: e.target.value })}
                  placeholder="Display name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="merchant-org">Organization</Label>
                <Select value={merchantForm.select} onValueChange={(v) => setMerchantForm({ ...merchantForm, select: v })}>
                  <SelectTrigger id="merchant-org">
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.name} value={org.name}>
                        {org.organization_name ?? org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="merchant-currency">Default Currency</Label>
                <Select value={merchantForm.default_currency} onValueChange={(v) => setMerchantForm({ ...merchantForm, default_currency: v })}>
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
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="merchant-active"
                  checked={merchantForm.is_active}
                  onChange={(e) => setMerchantForm({ ...merchantForm, is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="merchant-active">Is Active</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="merchant-email">Contact Email</Label>
                <Input id="merchant-email" value={merchantForm.contact_email} onChange={(e) => setMerchantForm({ ...merchantForm, contact_email: e.target.value })} placeholder="email@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="merchant-person">Contact Person</Label>
                <Input id="merchant-person" value={merchantForm.contact_person} onChange={(e) => setMerchantForm({ ...merchantForm, contact_person: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="merchant-phone">Contact Phone</Label>
                <Input id="merchant-phone" value={merchantForm.contact_phone} onChange={(e) => setMerchantForm({ ...merchantForm, contact_phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="merchant-webhook">Webhook URL</Label>
                <Input id="merchant-webhook" value={merchantForm.webhook_url} onChange={(e) => setMerchantForm({ ...merchantForm, webhook_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="merchant-apiver">API Version</Label>
                <Input id="merchant-apiver" value={merchantForm.api_version} onChange={(e) => setMerchantForm({ ...merchantForm, api_version: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="merchant-info">Additional Information</Label>
                <textarea
                  id="merchant-info"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={merchantForm.additional_information}
                  onChange={(e) => setMerchantForm({ ...merchantForm, additional_information: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsMerchantModalOpen(false)}>Cancel</Button>
              <Button onClick={handleMerchantSubmit} disabled={merchantSubmitting}>
                {merchantSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isMerchantDeleteOpen} onOpenChange={setIsMerchantDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Merchant</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedMerchant?.merchant_name ?? selectedMerchant?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleMerchantDeleteConfirm} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Merchant Gateway Account Modal */}
        <Dialog open={isAccountModalOpen} onOpenChange={setIsAccountModalOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{accountMode === 'create' ? 'Create Gateway Account' : 'Edit Gateway Account'}</DialogTitle>
              <DialogDescription>
                {accountMode === 'create' ? 'Add a new Merchant Gateway Account (ERPNext).' : 'Update gateway account.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="account-merchant">Merchant *</Label>
                <Select value={accountForm.merchant} onValueChange={(v) => setAccountForm({ ...accountForm, merchant: v })}>
                  <SelectTrigger id="account-merchant">
                    <SelectValue placeholder="Select merchant" />
                  </SelectTrigger>
                  <SelectContent>
                    {merchants.map((m) => (
                      <SelectItem key={m.name} value={m.name}>
                        {m.merchant_name ?? m.name} ({m.merchant_code ?? m.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-account-name">Account Name</Label>
                <Input id="account-account-name" value={accountForm.account_name} onChange={(e) => setAccountForm({ ...accountForm, account_name: e.target.value })} placeholder="Display name for this account" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-merchant-id">Merchant ID</Label>
                <Input id="account-merchant-id" value={accountForm.merchant_id} onChange={(e) => setAccountForm({ ...accountForm, merchant_id: e.target.value })} placeholder="Gateway merchant ID" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-api-key">API Key</Label>
                <Input id="account-api-key" type="password" value={accountForm.api_key} onChange={(e) => setAccountForm({ ...accountForm, api_key: e.target.value })} placeholder="e.g. pk_live_..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-secret">Merchant Secret</Label>
                <Input id="account-secret" type="password" value={accountForm.merchant_secret} onChange={(e) => setAccountForm({ ...accountForm, merchant_secret: e.target.value })} placeholder="e.g. sk_live_..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-webhook-secret">Webhook Secret</Label>
                <Input id="account-webhook-secret" type="password" value={accountForm.webhook_secret} onChange={(e) => setAccountForm({ ...accountForm, webhook_secret: e.target.value })} placeholder="whsec_..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-environment">Environment</Label>
                <Select value={accountForm.environment} onValueChange={(v: 'Sandbox' | 'Production') => setAccountForm({ ...accountForm, environment: v })}>
                  <SelectTrigger id="account-environment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sandbox">Sandbox</SelectItem>
                    <SelectItem value="Production">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-currency">Currency</Label>
                <Select value={accountForm.currency} onValueChange={(v) => setAccountForm({ ...accountForm, currency: v })}>
                  <SelectTrigger id="account-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-payment-gateway">Payment Gateway</Label>
                <Input id="account-payment-gateway" value={accountForm.payment_gateway} onChange={(e) => setAccountForm({ ...accountForm, payment_gateway: e.target.value })} placeholder="e.g. Stripe" />
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="account-default" checked={accountForm.is_default} onChange={(e) => setAccountForm({ ...accountForm, is_default: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />
                <Label htmlFor="account-default">Is Default</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="account-active" checked={accountForm.is_active} onChange={(e) => setAccountForm({ ...accountForm, is_active: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />
                <Label htmlFor="account-active">Is Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAccountModalOpen(false)}>Cancel</Button>
              <Button onClick={handleAccountSubmit} disabled={accountSubmitting}>
                {accountSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isAccountDeleteOpen} onOpenChange={setIsAccountDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Gateway Account</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this gateway account? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleAccountDeleteConfirm} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
