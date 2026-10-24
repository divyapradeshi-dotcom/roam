import {DocumentTextIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

export const policy = defineType({
  name: 'policy',
  title: 'Policy',
  type: 'document',
  icon: DocumentTextIcon,
  fields: [
    defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'title', maxLength: 80},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'kind',
      type: 'string',
      options: {
        list: [
          {title: 'Cancellation', value: 'cancellation'},
          {title: 'Booking', value: 'booking'},
          {title: 'Pets', value: 'pets'},
          {title: 'Damage and security deposit', value: 'damage'},
          {title: 'Check-in and check-out', value: 'checkIn'},
          {title: 'Guest refund', value: 'guestRefund'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'summary', type: 'string', validation: (rule) => rule.required().max(160)}),
    defineField({name: 'body', type: 'text', rows: 8, validation: (rule) => rule.required()}),
  ],
  preview: {select: {title: 'title', subtitle: 'kind'}},
})
