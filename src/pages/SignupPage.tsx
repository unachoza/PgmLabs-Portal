import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api } from '../lib/apiClient';
import { useAuth } from '../auth/AuthContext';
import { FormField } from '../components/FormField';
import './LoginPage.css';

type Role = 'participant' | 'funder';

export function SignupPage() {
    const navigate = useNavigate();
    const { profile, loading, signIn } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<Role>('participant');
    const [cohort, setCohort] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    if (!loading && profile) return <Navigate to="/" replace />;

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            await api.post('/auth/signup', {
                name,
                email,
                password,
                role,
                cohort: role === 'participant' ? cohort : undefined,
            });
            await signIn(email, password);
            navigate('/');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to create account.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="login-page">
            <form className="login-card" onSubmit={handleSubmit} noValidate>
                <h1>Create account</h1>
                <p className="form-hint">Create a participant or funder account for the portal.</p>
                {error && (
                    <div className="banner-error" role="alert">
                        {error}
                    </div>
                )}

                <FormField label="Name" required>
                    {(id) => <input id={id} required value={name} onChange={(e) => setName(e.target.value)} />}
                </FormField>

                <FormField label="Email address" required>
                    {(id) => (
                        <input
                            id={id}
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    )}
                </FormField>

                <FormField label="Password" required hint="Use at least 8 characters.">
                    {(id) => (
                        <input
                            id={id}
                            type="password"
                            autoComplete="new-password"
                            minLength={8}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    )}
                </FormField>

                <FormField label="Account type" required>
                    {(id) => (
                        <select id={id} required value={role} onChange={(e) => setRole(e.target.value as Role)}>
                            <option value="participant">Participant</option>
                            <option value="funder">Funder</option>
                        </select>
                    )}
                </FormField>

                {role === 'participant' && (
                    <FormField label="Cohort" required hint="Participants need a cohort assignment.">
                        {(id) => <input id={id} required value={cohort} onChange={(e) => setCohort(e.target.value)} />}
                    </FormField>
                )}

                <button className="btn" type="submit" disabled={submitting}>
                    {submitting ? 'Creating account…' : 'Create account'}
                </button>
                <p className="auth-switch">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </form>
        </div>
    );
}