import React, { useState } from 'react';
import formStyles from '../layout/Form.module.css';

const NewMemberForm = ({ onClose }) => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('MEMBER');

    const handleSubmit = (event) => {
        event.preventDefault();
        const formData = { email, role };
        console.log("New Member Invited:", formData);
        onClose();
    };

    return (
        <div className = { formStyles.formContainer }>
            {/* Add member */}
            <form onSubmit = { handleSubmit }>
                <div className = { formStyles.formBody }>
                    <div className = { formStyles.formGroup }>
                        <label htmlFor = "email" className = { formStyles.formLabel }>Email</label>
                        <input
                            type = "email"
                            id = "email"
                            value = { email }
                            onChange = { (e) => setEmail(e.target.value) }
                            className = { formStyles.formInput }
                            placeholder = "jsdoe@example.com"
                            required
                        />
                    </div>

                    {/* Organization */}
                    <div className = { formStyles.formGroup }>
                        <label htmlFor = "role" className = { formStyles.formLabel }>Organization Role</label>
                        <select
                            id = "role"
                            value = { role }
                            onChange = { (e) => setRole(e.target.value) }
                            className = { formStyles.formSelect }
                        >
                            <option value = "OWNER">Owner</option>
                            <option value = "ADMIN">Admin</option>
                            <option value = "MEMBER">Member</option>
                            <option value = "VIEWER">Viewer</option>
                            <option value = "NONE">None</option>
                        </select>
                    </div>
                </div>

                <footer className = { formStyles.formFooter }>
                    <button type = "submit" className = { formStyles.submitButton }>
                        Grant access
                    </button>
                </footer>
            </form>
        </div>
    );
};

export default NewMemberForm;