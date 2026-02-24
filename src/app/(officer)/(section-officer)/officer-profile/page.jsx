
import { Breadcrumb } from '../../../components/breadcrumb'
import { OfficerProfileAccordion } from '../officer-profile/officer-profile-accordian'

export default async function UpdateProfile() {
  return (
    <>
      <Breadcrumb/>
      <div className="grid grid-cols-12 gap-4">
       
        <div className="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12">
        
          <OfficerProfileAccordion/>
        
        </div>

        
      </div>
        
    </>  
  )
}
