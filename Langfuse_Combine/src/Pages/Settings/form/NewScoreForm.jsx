import React, { useState } from 'react';
import { Trash2, Plus } from 'lucide-react'
import commonStyles from '../layout/SettingsCommon.module.css';
import formStyles from '../layout/Form.module.css';

const NewScoreForm = ({ onClose, onSave }) => {
    const [name, setName] = useState('');
    const [dataType, setDataType] = useState('NUMERIC');
    const [minValue, setMinValue] = useState('');
    const [maxValue, setMaxValue] = useState('');
    const [description, setDescription] = useState('');
    // CATEGORICAL 타입일 때의 상태 추가
    const [categories, setCategories] = useState([{ value: 1, label: '' }]);

    const handleSubmit = (event) => {
        event.preventDefault();

        // <<< START: dataType에 맞는 데이터만 onSave로 전달하도록 수정 >>>
        const formData = {
            name,
            dataType,
            minValue,
            maxValue,
            description,
        };

        if (dataType === 'CATEGORICAL') {
            formData.categories = categories;
        }
        // NUMERIC과 BOOLEAN일 때는 categories를 전달하지 않음

        onSave(formData);
        // <<< END: dataType에 맞는 데이터만 onSave로 전달하도록 수정 >>>
    };

    // 카테고리 라벨 변경 핸들러
    const handleCategoryLabelChange = (index, label) => {
        const newCategories = [...categories];
        newCategories[index].label = label;
        setCategories(newCategories);
    };

    // 카테고리 값 변경 핸들러 (사용자가 직접 수정할 수 있도록)
    const handleCategoryValueChange = (index, value) => {
        const newCategories = [...categories];
        const numValue = parseInt(value, 10);
        // 숫자이거나 빈 문자열일 때만 상태 업데이트
        if (!isNaN(numValue) || value === '') {
             newCategories[index].value = isNaN(numValue) ? 0 : numValue; // 빈 문자열이면 0으로 처리하거나 다른 기본값 설정 가능
             setCategories(newCategories);
        }
    };

    const addCategory = () => {
        // value는 현재 카테고리 개수에 따라 순차적으로 증가
        const nextValue = categories.length > 0 ? Math.max(...categories.map(c => c.value)) + 1 : 0;
        setCategories([...categories, { value: nextValue, label: '' }]);
    };

    const removeCategory = (index) => {
        setCategories(categories.filter((_, i) => i !== index));
    };

    return (
        <div className = { formStyles.formContainer }>
            {/* form */}
            <form onSubmit = { handleSubmit }>
                <div className = { formStyles.formBody }>
                    { /* name */}
                    <div className = { formStyles.formGroup }>
                        <label htmlFor = "name" className = { formStyles.formLabel }>Name</label>
                        <input
                            type = "text"
                            id = "name"
                            value = { name }
                            onChange = { (e) => setName(e.target.value) }
                            className = { formStyles.formInput }
                            required
                        />
                    </div>

                    {/* Data Type */}
                    <div className = { formStyles.formGroup }>
                        <label htmlFor = "dataType" className = { formStyles.formLabel }>Data type</label>
                        <select
                            id = "dataType"
                            value = { dataType }
                            onChange = { (e) => setDataType(e.target.value) }
                            className = { formStyles.formSelect }
                        >
                            <option value = "NUMERIC">NUMERIC</option>
                            <option value = "CATEGORICAL">CATEGORICAL</option>
                            <option value = "BOOLEAN">BOOLEAN</option>
                        </select>
                    </div>

                    {/* Data Type === 'NUMERIC' */}
                    {dataType === 'NUMERIC' && (
                        <>
                            <div className = { formStyles.formGroup }>
                                <label htmlFor = "minValue" className = { formStyles.formLabel }>Minimum (optional)</label>
                                <input
                                    type = "number"
                                    id = "minValue"
                                    value = { minValue }
                                    onChange = { (e) => setMinValue(e.target.value) }
                                    className = { formStyles.formInput }
                                />
                            </div>
                            <div className = { formStyles.formGroup }>
                                <label htmlFor = "maxValue" className = { formStyles.formLabel }>Maximum (optional)</label>
                                <input
                                    type = "number"
                                    id = "maxValue"
                                    value = { maxValue }
                                    onChange = { (e) => setMaxValue(e.target.value) }
                                    className = { formStyles.formInput }
                                />
                            </div>
                        </>
                    )}

                    {/* Data Type === 'CATEGORICAL' */}
                    {dataType === 'CATEGORICAL' && (
                        <div className={formStyles.formGroup}>
                             <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                                <label className={formStyles.formLabel} style={{ flexBasis: '100px', flexGrow: 0 }}>Value</label>
                                <label className={formStyles.formLabel}>Label</label>
                            </div>
                            {categories.map((cat, index) => (
                                <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input
                                        type="number"
                                        value={cat.value}
                                        onChange={(e) => handleCategoryValueChange(index, e.target.value)}
                                        className={formStyles.formInput}
                                        style={{ flexBasis: '100px', flexGrow: 0 }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Label"
                                        value={cat.label}
                                        onChange={(e) => handleCategoryLabelChange(index, e.target.value)}
                                        className={formStyles.formInput}
                                        required
                                    />
                                    <button type="button" onClick={() => removeCategory(index)} className={commonStyles.button} style={{ padding: '8px', background: 'transparent', border: '1px solid #444' }}>
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={addCategory} className={commonStyles.button} style={{ marginTop: '8px', alignSelf: 'center', width: '100%' }}>
                                <Plus size={16}/> Add category
                            </button>
                        </div>
                    )}

                    {/* dataType === 'BOOLEAN */}
                    {dataType === 'BOOLEAN' && (
                        <div className={formStyles.formGroup}>
                             <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                                <label className={formStyles.formLabel} style={{ flexBasis: '100px', flexGrow: 0 }}>Value</label>
                                <label className={formStyles.formLabel}>Label</label>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input type="number" value={1} disabled className={formStyles.formInput} style={{ flexBasis: '100px', flexGrow: 0 }}/>
                                <input type="text" value="True" disabled className={formStyles.formInput} />
                            </div>
                             <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input type="number" value={0} disabled className={formStyles.formInput} style={{ flexBasis: '100px', flexGrow: 0 }}/>
                                <input type="text" value="False" disabled className={formStyles.formInput} />
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <div className = { formStyles.formGroup }>
                        <label htmlFor = "description" className = { formStyles.formLabel }>Description (optional)</label>
                        <textarea
                            id = "description"
                            value = { description }
                            onChange = { (e) => setDescription(e.target.value) }
                            className = { formStyles.formTextarea }
                            placeholder = "Provide an optional description of the score config..."
                            rows = { 4 }
                        />
                    </div>
                </div>

                {/* form footer */}
                <footer className = {formStyles.formFooter }>
                    <button type = "submit" className = { commonStyles.button } style = {{ width: '100%'}}>
                        Submit
                    </button>
                </footer>
            </form>
        </div>
    );
};

export default NewScoreForm;