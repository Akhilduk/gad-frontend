'use client'

import { useState, useEffect, useMemo } from 'react'
import { PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/16/solid'
import axiosInstance from '@/utils/apiClient'
import { getServiceTypeName, SERVICE_TYPE_MAP } from '@/utils/serviceTypeUtils'
import { ModalAddPostDetails } from '../modal/add-post-details'
import {
  SearchBar,
  ExportButtons,
  PaginationControls,
  exportToCSV,
  exportToPDF,
  exportToExcel,
} from '../../../components/dataTableControls';

export function PostList() {
  const [isModalOpen, setModalOpen] = useState(false)
  const [postData, setPostData] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 25

  const [masterData, setMasterData] = useState({
    office: [],
    post: [],
  })

  useEffect(() => {
    fetchOfficePosts()
    fetchMasterData()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const fetchOfficePosts = async () => {
    setLoading(true)
    try {
      const response = await axiosInstance.get('/admin/office-post/')
      setPostData(Array.isArray(response?.data?.data?.office_post) ? response.data.data.office_post : [])
    } catch (error) {
      console.error('Error fetching post data:', error.response?.data || error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchMasterData = async () => {
    try {
      const [officeRes, postRes] = await Promise.all([
        axiosInstance.get('/masters/office'),
        axiosInstance.get('/masters/post'),
      ])
      setMasterData({
        office: officeRes.data.data.office || [],
        post: postRes.data.data.post || [],
      })
    } catch (error) {
      console.error('Error fetching master data:', error)
    }
  }

  const handleDeleteClick = async (office_post_id) => {
    if (!window.confirm('Are you sure you want to delete this office post?')) return
    try {
      await axiosInstance.delete(`/admin/office-post/${office_post_id}/`)
      alert('Office Post deleted successfully')
      fetchOfficePosts()
    } catch (error) {
      console.error('Error deleting office post:', error.response?.data || error.message)
      alert('Failed to delete office post')
    }
  }

  const getOfficeName = (id) => masterData.office.find((o) => o.office_id === id)?.office_name || '-'
  const getPostName = (id) => masterData.post.find((p) => p.post_id === id)?.post_name || '-'

  const filteredOfficePosts = postData.filter((post) =>
    getPostName(post.post_id).toLowerCase().includes(searchTerm.toLowerCase())
  )

  const paginatedPosts = filteredOfficePosts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  const totalPages = Math.ceil(filteredOfficePosts.length / itemsPerPage)

  const handleExportCSV = () => {
    const headers = ['Sl. No', 'Post Name', 'Max Officers', 'Service Type', 'Office Name']
    const rows = filteredOfficePosts.map((post, index) => [
      index + 1,
      getPostName(post.post_id),
      post.max_no_of_officer,
      getServiceTypeName(post.service_type_id),
      getOfficeName(post.office_id),
    ])
    exportToCSV('post-list.csv', headers, rows)
  }

  const handleExportPDF = () => {
    const headers = ['Sl. No', 'Post Name', 'Max Officers', 'Service Type', 'Office Name']
    const rows = filteredOfficePosts.map((post, index) => [
      index + 1,
      getPostName(post.post_id),
      post.max_no_of_officer,
      getServiceTypeName(post.service_type_id),
      getOfficeName(post.office_id),
    ])
    exportToPDF('Post List', headers, rows, 'post-list.pdf')
  }

  const handleExportExcel = () => {
    const data = filteredOfficePosts.map((post, index) => ({
      'Sl. No': index + 1,
      'Post Name': getPostName(post.post_id),
      'Max Officers': post.max_no_of_officer,
      'Service Type': getServiceTypeName(post.service_type_id),
      'Office Name': getOfficeName(post.office_id),
    }))
    exportToExcel('Post List', data, 'post-list.xlsx')
  }

  const handleAddClick = () => {
    setSelectedPost(null)
    setModalOpen(true)
  }

  const handleEditClick = (office_post) => {
    setSelectedPost(office_post)
    setModalOpen(true)
  }

  const handleSave = () => fetchOfficePosts()

  return (
    <div className="bg-white p-3 pt-0 rounded-xl border w-full mb-3 dark:bg-gray-800 dark:border-gray-900">
      <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-3 dark:bg-gray-800 dark:border-gray-900">
        <h3 className="text-base font-semibold text-indigo-700 dark:text-white mb-3 uppercase">Post List</h3>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search by Post Name..." />

          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-700 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              onClick={handleAddClick}
            >
              Add New Post
              <PlusIcon aria-hidden="true" className="mr-0.5 size-5" />
            </button>
            <ExportButtons onCSV={handleExportCSV} onPDF={handleExportPDF} onExcel={handleExportExcel} />
          </div>
        </div>
      </div>

         {/* Table displaying post data */}
      {loading ? (
        <div className="text-center py-4">Loading post list...</div>
      ) : (
        <div className="mx-auto max-w-12xl overflow-x-auto">
          <table className="table-auto w-full text-left border-collapse">
            <thead className="text-gray-600 text-sm">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sl. No</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Post Name</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max no.of Officer</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Type</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Office Name</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider float-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPosts.map((post, index) => (
                <tr key={index} className="odd:bg-white odd:dark:bg-gray-800 even:bg-gray-50 even:dark:bg-gray-700">
                <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">{index + 1}</td>
                  <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">{post.post_name}</td>
                  <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">{post.max_no_of_officer}</td>
                  <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">{getServiceTypeName(post.service_type_id)}</td>
                  <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">{getOfficeName(post.office_id)}</td>
                  <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">
                    <div className="flex justify-end">
                                          <button type="button" className="me-2 float-right inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover:text-indigo-500 hover:ring-indigo-500 px-2.5 py-1.5 text-sm font-semibold text-grey  "
                                                  onClick={() => handleEditClick(post)}
                    >
                          Edit <PencilSquareIcon aria-hidden="true" className="-mr-0.5 size-5" />
                      </button>
                      <button
                            type="button"
                            className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 text-red-600 hover:bg-red-600 hover:text-white hover:ring-0 px-2.5 py-1.5 text-sm font-semibold text-grey"
                            onClick={() => handleDeleteClick(post.office_post_id)}
                        >
                            <TrashIcon aria-hidden="true" className="-mr-0.5 size-5" />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPrevious={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        onNext={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
      />

      <ModalAddPostDetails
        open={isModalOpen}
        setOpen={setModalOpen}
        post={selectedPost}
        onSave={handleSave}
        masterData={masterData}
        serviceTypeMap={SERVICE_TYPE_MAP}
      />
    </div>
  )
}
