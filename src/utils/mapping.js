export const handleStateDistrictChange = (
  e,
  formData,
  setFormData,
  stateField,
  districtField,
  districts
) => {
  const { name, value } = e.target;

  // Update form data
  setFormData((prevState) => {
    const updatedData = { ...prevState, [name]: value };

    // If the state field changed
    if (name === stateField) {
      const newStateId = value ? parseInt(value, 10) : null;

      // Reset district_id to null if state_id is null or changed
      if (!newStateId || newStateId !== parseInt(prevState[stateField], 10)) {
        updatedData[districtField] = null;
      }
    }

    return updatedData;
  });

  // Filter districts based on the selected state
  const selectedStateId = name === stateField ? parseInt(value, 10) : parseInt(formData[stateField], 10);
  return districts.filter((district) => district.state_id === selectedStateId) || [];
};