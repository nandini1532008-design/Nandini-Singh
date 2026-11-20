export type SupportedLanguage =
  | "javascript"
  | "python"
  | "java"
  | "cpp"
  | "typescript"
  | "go"
  | "php";

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface Finding {
  type: "bug" | "security" | "performance";
  title: string;
  severity: "low" | "medium" | "high";
  lineRef: string;
  description: string;
  whyItMatters: string;
}

export interface ReviewReportData {
  reviewId: string;
  submissionId: string;
  language: SupportedLanguage;
  code: string;
  summary: string;
  qualityScore: number;
  findings: Finding[];
  improvedCode: string;
  createdAt: string;
}

export const LANGUAGE_OPTIONS: Array<{
  value: SupportedLanguage;
  label: string;
  monacoId: string;
  sampleCode: string;
}> = [
  {
    value: "javascript",
    label: "JavaScript",
    monacoId: "javascript",
    sampleCode: `function findUserDiscount(users, targetId) {
  for (var i = 0; i <= users.length; i++) {
    if (users[i].id == targetId) {
      let discount = 0;
      if (users[i].isVip = true) {
        discount = 0.25;
      }
      return users[i].price - (users[i].price * discount);
    }
  }
  return null;
}`,
  },
  {
    value: "python",
    label: "Python",
    monacoId: "python",
    sampleCode: `import sqlite3

def get_user_profile(username):
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    query = f"SELECT id, email, role FROM users WHERE username = '{username}'"
    cursor.execute(query)
    rows = cursor.fetchall()
    return rows`,
  },
  {
    value: "typescript",
    label: "TypeScript",
    monacoId: "typescript",
    sampleCode: `interface OrderItem {
  id: string;
  price: number;
  qty: number;
}

export function calculateTotals(items: OrderItem[], taxRate?: number) {
  let total = 0;
  for (const item of items) {
    for (const duplicate of items) {
      if (duplicate.id === item.id) {
        total += item.price * item.qty;
      }
    }
  }
  return total + total * taxRate!;
}`,
  },
  {
    value: "java",
    label: "Java",
    monacoId: "java",
    sampleCode: `public class PasswordCheck {
    public static boolean checkLogin(String inputPassword, String storedPassword) {
        if (inputPassword == storedPassword) {
            return true;
        }
        return false;
    }

    public static String buildReport(String[] entries) {
        String result = "";
        for (int i = 0; i < entries.length; i++) {
            result = result + entries[i] + "\\n";
        }
        return result;
    }
}`,
  },
  {
    value: "cpp",
    label: "C++",
    monacoId: "cpp",
    sampleCode: `#include <iostream>
#include <cstring>

void greetUser(const char* name) {
    char buffer[16];
    strcpy(buffer, name);
    std::cout << "Hello, " << buffer << std::endl;
}

int* createArray(int n) {
    int* arr = new int[n];
    for (int i = 0; i <= n; i++) {
        arr[i] = i * 2;
    }
    return arr;
}`,
  },
  {
    value: "go",
    label: "Go",
    monacoId: "go",
    sampleCode: `package main

import (
	"fmt"
	"os"
)

func readConfig(path string) string {
	data, _ := os.ReadFile(path)
	return string(data)
}

func sumSlice(nums []int) int {
	total := 0
	for i := 0; i <= len(nums); i++ {
		total += nums[i]
	}
	fmt.Println("Total:", total)
	return total
}`,
  },
  {
    value: "php",
    label: "PHP",
    monacoId: "php",
    sampleCode: `<?php
function fetchInvoice($pdo, $invoiceId) {
    $sql = "SELECT * FROM invoices WHERE id = " . $_GET['id'];
    $stmt = $pdo->query($sql);
    $row = $stmt->fetch();
    echo "<div>Invoice for: " . $row['customer_name'] . "</div>";
    return $row;
}`,
  },
];
