import glob,os
lib=open('lib9.js').read()
for f in glob.glob('*.js'):
    if f=='lib9.js': continue
    s=open(f).read().replace('//@LIB',lib)
    open('../js9/'+f,'w').write(s)
print('composed')
