import React, { createContext, useContext, useState, ReactNode } from 'react';

// 1. CLEAN INTERFACE
interface BankingContextType {
  balance: number;
  transactions: any[];
  notifications: any[];
  userPin: string;
  incidentCounts: Record<string, number>;
  beneficiaries: any[];
  verifiedRecipient: { 
    name: string; 
    bank: string; 
    accNo: string; 
    risk?: string; 
    score?: string;  
  } | null;
  setVerifiedRecipient: (recipient: any) => void; 
  addTransaction: (type: string, amount: number, status: string) => void;
  sendMoney: (amount: number, recipient: string, location?: string) => void;
  deposit: (amount: number) => void;
}

const BankingContext = createContext<BankingContextType | undefined>(undefined);

export const BankingProvider = ({ children }: { children: ReactNode }) => {
  const [balance, setBalance] = useState(125400.50);
  const [verifiedRecipient, setVerifiedRecipient] = useState<any>(null);
  const [transactions, setTransactions] = useState([
    { id: '1', type: 'Transfer to Tunde', amount: -5000, date: '2026-01-05', status: 'Completed' },
    { id: '2', type: 'Salary Deposit', amount: 85000, date: '2026-01-04', status: 'Completed' },
  ]);

  const [beneficiaries] = useState([
    { id: '1', name: 'Tunde Mike', account: '3081234567', bank: 'Pivota Bank', risk: 'Low', score: '98%', image: 'https://i.pravatar.cc/150?u=tunde' },
    { id: '2', name: 'Sarah Jinadu', account: '0012345678', bank: 'Access Bank', risk: 'Medium', score: '75%', image: 'https://i.pravatar.cc/150?u=sarah' },
  ]);

  const incidentCounts = { "Lagos": 150, "Abuja": 45, "Ikeja": 210 };
  const notifications: any[] = [];
  const userPin = '1234';

  const addTransaction = (type: string, amount: number, status: string) => {
    const newEntry = {
      id: Math.random().toString(),
      type,
      amount,
      date: new Date().toISOString().split('T')[0],
      status,
    };
    setTransactions(prev => [newEntry, ...prev]);
  };

  const sendMoney = (amount: number, recipient: string, location: string = 'Unknown') => {
    addTransaction(`Transfer to ${recipient}`, amount, 'Completed');
    setBalance(prev => prev - amount);
  };

  const deposit = (amount: number) => {
    addTransaction('Deposit', amount, 'Completed');
    setBalance(prev => prev + amount);
  };

  return (
    <BankingContext.Provider value={{ 
      balance, transactions, notifications, userPin, incidentCounts,
      beneficiaries, verifiedRecipient, setVerifiedRecipient,
      addTransaction, sendMoney, deposit
    }}>
      {children}
    </BankingContext.Provider>
  );
};

// EXPORT NAMED HOOK
export const useBanking = () => {
  const context = useContext(BankingContext);
  if (context === undefined) {
    throw new Error('useBanking must be used within a BankingProvider');
  }
  return context;
};