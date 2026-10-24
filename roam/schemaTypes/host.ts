import {UserIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

export const host = defineType({
  name: 'host',
  title: 'Host',
  type: 'document',
  icon: UserIcon,
  groups: [
    {name: 'profile', title: 'Profile', default: true},
    {name: 'hosting', title: 'Hosting'},
  ],
  fields: [
    defineField({name: 'name', type: 'string', group: 'profile', validation: (rule) => rule.required()}),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'profile',
      options: {source: 'name', maxLength: 80},
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'bio', type: 'text', rows: 4, group: 'profile'}),
    defineField({name: 'isSuperhost', title: 'Superhost', type: 'boolean', group: 'hosting'}),
    defineField({name: 'hostingSince', type: 'date', group: 'hosting'}),
    defineField({
      name: 'responseTime',
      type: 'string',
      group: 'hosting',
      options: {
        list: [
          {title: 'Within an hour', value: 'withinAnHour'},
          {title: 'Within a few hours', value: 'withinAFewHours'},
          {title: 'Within a day', value: 'withinADay'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'languages',
      type: 'array',
      group: 'hosting',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
    }),
  ],
  preview: {select: {title: 'name', subtitle: 'bio'}},
})
