export interface CheckResult {
  username: string;
  post_date: string;
  error: boolean;
}

export interface StoredSession {
  usernames: string[];
  results: CheckResult[];
  currentIndex: number;
  minDelay: number;
  maxDelay: number;
  fileName: string;
}
