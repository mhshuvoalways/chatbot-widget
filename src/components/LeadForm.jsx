import React, { useState } from 'react';

const LeadForm = ({ leadForm, config }) => {
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      const isValid = leadForm.form_fields.every(field => {
        if (field.required && !formData[field.id]) {
          return false;
        }
        return true;
      });

      if (!isValid) {
        alert('Please fill in all required fields.');
        return;
      }

      setIsSubmitting(true);

      // Submit the form
      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/submit-lead`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.supabaseKey}`,
          },
          body: JSON.stringify({
            conversationId: leadForm.conversation_id,
            formData: formData,
            websiteUrl: window.location.href,
          }),
        }
      );

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        throw new Error('Failed to submit form');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('There was an error submitting the form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 max-w-[80%] w-full">
        <div className="text-center text-green-600 font-semibold">
          ✓ Thank you! Your information has been submitted successfully.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 max-w-[80%] w-full">
      <h4 className="m-0 mb-3 font-semibold text-gray-700">
        Please fill out this form:
      </h4>

      {leadForm.form_fields.map((field) => (
        <div key={field.id} className="mb-3">
          <label className="block mb-1 font-medium text-gray-700 text-sm">
            {field.label}{field.required ? ' *' : ''}
          </label>
          
          {field.type === 'textarea' ? (
            <textarea
              rows={3}
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              required={field.required}
              className="w-full p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500 box-border resize-none"
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            />
          ) : (
            <input
              type={field.type}
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              required={field.required}
              className="w-full p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500 box-border"
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            />
          )}
        </div>
      ))}

      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="text-white border-none py-2.5 px-5 rounded-md cursor-pointer font-semibold w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        style={{ backgroundColor: config.primaryColor }}
      >
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </div>
  );
};

export default LeadForm;