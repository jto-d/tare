type Props = {
  authError: string | null;
};

export function SignInScreen({ authError }: Props) {
  return (
    <div className="signin">
      <div className="signin-hero">
        <div className="logo-tile">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="6" y="14" width="20" height="3" rx="1.5" fill="white" />
            <rect x="13" y="6" width="3" height="8" rx="1.5" fill="white" opacity="0.5" />
            <rect x="13" y="18" width="3" height="8" rx="1.5" fill="white" opacity="0.5" />
            <circle cx="8" cy="9" r="3" fill="white" opacity="0.3" />
            <circle cx="24" cy="9" r="3" fill="white" opacity="0.3" />
          </svg>
        </div>
        <div className="wordmark">tare</div>
        <div className="tagline">weigh yourself every morning. watch the pattern.</div>
      </div>

      <div>
        <a href="/auth/google" className="g-btn" style={{ textDecoration: 'none' }}>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path
              d="M17.64 9.2a10.34 10.34 0 0 0-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62z"
              fill="#4285F4"
            />
            <path
              d="M9 18a8.59 8.59 0 0 0 5.96-2.18l-2.91-2.26a5.4 5.4 0 0 1-8.06-2.85H.96v2.34A9 9 0 0 0 9 18z"
              fill="#34A853"
            />
            <path
              d="M3.99 10.71a5.41 5.41 0 0 1 0-3.42V4.95H.96a9 9 0 0 0 0 8.1l3.03-2.34z"
              fill="#FBBC05"
            />
            <path
              d="M9 3.58a4.86 4.86 0 0 1 3.44 1.35L14.5 2.86A8.65 8.65 0 0 0 9 0 9 9 0 0 0 .96 4.95L4 7.3A5.36 5.36 0 0 1 9 3.58z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </a>
        <div className="signin-fine">by continuing, you agree to our terms</div>
        {authError && <div className="err-banner">{authError}</div>}
      </div>
    </div>
  );
}
